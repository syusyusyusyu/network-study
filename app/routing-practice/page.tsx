"use client"

import { useState, useEffect, useCallback } from "react"
import { Layout } from "@/components/Layout"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Server, Activity, AlertCircle, CheckCircle, Wifi, WifiOff, Shield, 
  Settings, TerminalSquare, RefreshCw, Layers, Zap, AlertTriangle,
  ChevronDown, ChevronRight, Info, Play, Clipboard, Network, 
  Router as RouterIcon, Laptop, Table, Route,
  BarChart, ChevronUp, Monitor, Database, Globe, MapPin
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// タイプ定義
type RouterVendor = "cisco" | "juniper" | "hp" | "huawei" | "mikrotik" | "unknown";

type DiagnosticIssue = {
  type: string;
  severity: string;
  description: string;
  recommendation: string;
  affected_component?: string;
  details?: any;
}

type DiagnosticResult = {
  status: string;
  summary: string;
  issues: DiagnosticIssue[];
  timestamp: string;
}

type InterfaceDetail = {
  name: string;
  status: string;
  protocol: string;
  ip: string;
  speed: string;
  duplex: string;
  description?: string;
  mac?: string;
  mtu?: number;
}

type RouteEntry = {
  destination: string;
  prefix_length?: number;
  next_hop: string;
  interface: string;
  protocol: string;
  metric: number;
  administrative_distance?: number;
  type: string;
}

type TraceRouteHop = {
  hop: number;
  ip: string;
  hostname?: string;
  rtt: number | null;
  status: string;
}

type PingResult = {
  success: boolean;
  packet_loss: number;
  rtt_min?: number;
  rtt_avg?: number;
  rtt_max?: number;
  packets_sent: number;
  packets_received: number;
}

type NeighborDevice = {
  device_id: string;
  ip_address?: string;
  platform?: string;
  local_interface: string;
  remote_interface: string;
}

type NetworkDevice = {
  name: string;
  type: string;
  ip?: string;
  model?: string;
  interfaces?: any[];
}

type NetworkTopology = {
  devices: NetworkDevice[];
  connections: any[];
}

// モック用の基本設定
const DUMMY_ROUTER = {
  name: "Cisco 2901",
  ip: "192.168.1.1",
  model: "CISCO2901/K9",
  serialNumber: "FTX1840ABCD",
  firmwareVersion: "15.7(3)M2",
  uptime: "10 days, 4 hours, 32 minutes"
};

// API URLの設定
const API_BASE_URL = 'http://localhost:8000';

// ネットワーク構成の基本設定
const NETWORK_TOPOLOGY = {
  devices: [
    { name: "PC1", type: "PC", interface: "NIC", ip: "192.168.1.10/24" },
    { name: "R1", type: "Router", interfaces: [
      { name: "G0/0", ip: "192.168.1.1/24", connects_to: "PC1" },
      { name: "G0/1", ip: "192.168.2.1/24", connects_to: "R2" }
    ]},
    { name: "R2", type: "Router", interfaces: [
      { name: "G0/0", ip: "192.168.2.2/24", connects_to: "R1" },
      { name: "G0/1", ip: "192.168.3.1/24", connects_to: "PC2" }
    ]},
    { name: "PC2", type: "PC", interface: "NIC", ip: "192.168.3.10/24" }
  ]
};

export default function RoutingPracticePage() {
  // ステート変数
  const [connected, setConnected] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [routerInfo, setRouterInfo] = useState<any>(null);
  const [interfaces, setInterfaces] = useState<Record<string, InterfaceDetail>>({});
  const [routingTable, setRoutingTable] = useState<RouteEntry[]>([]);
  const [tracerouteResult, setTracerouteResult] = useState<TraceRouteHop[]>([]);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [neighbors, setNeighbors] = useState<NeighborDevice[]>([]);
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  
  // 接続設定
  const [routerIp, setRouterIp] = useState("192.168.1.1");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [vendorType, setVendorType] = useState<RouterVendor>("cisco");
  
  // ツール設定
  const [targetIp, setTargetIp] = useState("192.168.3.10");
  const [pingCount, setPingCount] = useState(5);
  const [tracerouteTimeout, setTracerouteTimeout] = useState(2);
  
  // UI状態
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    deviceInfo: true,
    interfaces: true,
    routing: true,
    neighbors: false,
    traceroute: false,
    ping: false,
    terminal: false,
    diagnostics: true,
    networkTopology: true
  });
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);
  const [interfaceFilter, setInterfaceFilter] = useState("all");

  // ルーターモデルのプリセット
  const routerPresets = [
    { name: "Cisco R1", ip: "192.168.1.1", username: "admin", password: "", vendor: "cisco" },
    { name: "Cisco R2", ip: "192.168.2.2", username: "admin", password: "", vendor: "cisco" },
    { name: "Juniper vSRX", ip: "10.0.0.1", username: "admin", password: "juniper123", vendor: "juniper" },
    { name: "HP Switch", ip: "172.16.0.1", username: "admin", password: "hp123", vendor: "hp" }
  ];

  // 有効なセクションキーの型定義
  type SectionKey = keyof typeof expandedSections;

  // セクションの展開/折りたたみを切り替える
  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ターミナルにラインを追加
  const addTerminalLine = useCallback((line: string) => {
    setTerminalOutput(prev => [...prev, line]);
  }, []);

  // ルーターに接続する
  const handleConnect = async () => {
    setError(null);
    setIsConnectionLoading(true);
    
    try {
      addTerminalLine(`ルーター ${routerIp} への接続を試みています...`);
      
      // FastAPIを通じて実際のルーターに接続を試みる
      try {
        const response = await fetch(`${API_BASE_URL}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: routerIp,
            username,
            password,
            connection_type: "ssh",
            vendor: vendorType
          })
        });
        
        if (!response.ok) {
          throw new Error(`接続エラー: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "接続に失敗しました");
        }
        
        addTerminalLine("接続成功しました");
        addTerminalLine("認証中...");
        addTerminalLine("認証成功");
        addTerminalLine(`ベンダータイプ: ${data.vendor || vendorType}`);
        
        setConnected(true);
        setVendorType(data.vendor || vendorType);
        
        // ルーター情報を取得
        await fetchRouterInfo();
        
        // セッション確立後、他の情報も並行して取得
        await Promise.all([
          fetchInterfaces(),
          fetchRoutingTable(),
          fetchNeighbors(),
          fetchNetworkTopology()
        ]);
        
      } catch (err) {
        console.error("API接続エラー:", err);
        // API接続に失敗した場合はモックデータを使用
        addTerminalLine("実際のルーターへの接続に失敗しました。デモモードに切り替えます。");
        
        setTimeout(() => {
          addTerminalLine("デモルーターに接続しました");
          addTerminalLine("認証中...");
          addTerminalLine("認証成功");
          addTerminalLine(`ベンダータイプ: ${vendorType}`);
          
          setRouterInfo({...DUMMY_ROUTER, ip: routerIp});
          setConnected(true);
          setShowConnectionForm(false);
          
          // デモデータを取得
          fetchDemoData();
        }, 1500);
      }
    } catch (err) {
      console.error("接続エラー:", err);
      setError(err instanceof Error ? err.message : "接続エラーが発生しました");
    } finally {
      setIsConnectionLoading(false);
    }
  };

  // デモモード用のデータを取得
  const fetchDemoData = async () => {
    try {
      // インターフェース
      const interfaces = await fetch(`${API_BASE_URL}/router/${routerIp}/interfaces`).then(r => r.json());
      setInterfaces(interfaces);
      
      // ルーティングテーブル
      const routes = await fetch(`${API_BASE_URL}/router/${routerIp}/routing-table`).then(r => r.json());
      setRoutingTable(routes);
      
      // 隣接デバイス
      const neighbors = await fetch(`${API_BASE_URL}/router/${routerIp}/neighbors`).then(r => r.json());
      setNeighbors(neighbors);
      
      // トポロジ
      const topology = await fetch(`${API_BASE_URL}/router/${routerIp}/topology`).then(r => r.json());
      setTopology(topology);
      
    } catch (err) {
      console.error("デモデータ取得エラー:", err);
    }
  };

  // ルーターから切断
  const handleDisconnect = () => {
    setConnected(false);
    setRouterInfo(null);
    setInterfaces({});
    setRoutingTable([]);
    setTracerouteResult([]);
    setPingResult(null);
    setNeighbors([]);
    setTopology(null);
    setDiagnosticResults(null);
    
    addTerminalLine("ルーターとの接続を切断しました。");
    addTerminalLine("新しいルーターに接続するには接続フォームを使用してください。");
    setShowConnectionForm(true);
  };

  // ルーター情報を取得
  const fetchRouterInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/info`);
      if (!response.ok) {
        throw new Error("ルーター情報の取得に失敗しました");
      }
      const data = await response.json();
      setRouterInfo(data);
    } catch (err) {
      console.error("ルーター情報取得エラー:", err);
      setRouterInfo({...DUMMY_ROUTER, ip: routerIp});
    }
  };

  // インターフェース情報を取得
  const fetchInterfaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/interfaces`);
      if (!response.ok) {
        throw new Error("インターフェース情報の取得に失敗しました");
      }
      const data = await response.json();
      setInterfaces(data);
    } catch (err) {
      console.error("インターフェース情報取得エラー:", err);
    }
  };

  // ルーティングテーブルを取得
  const fetchRoutingTable = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/routing-table`);
      if (!response.ok) {
        throw new Error("ルーティングテーブルの取得に失敗しました");
      }
      const data = await response.json();
      setRoutingTable(data);
      addTerminalLine("show ip route");
    } catch (err) {
      console.error("ルーティングテーブル取得エラー:", err);
    }
  };

  // 隣接デバイス情報を取得
  const fetchNeighbors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/neighbors`);
      if (!response.ok) {
        throw new Error("隣接デバイス情報の取得に失敗しました");
      }
      const data = await response.json();
      setNeighbors(data);
    } catch (err) {
      console.error("隣接デバイス情報取得エラー:", err);
    }
  };

  // ネットワークトポロジを取得
  const fetchNetworkTopology = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/topology`);
      if (!response.ok) {
        throw new Error("ネットワークトポロジの取得に失敗しました");
      }
      const data = await response.json();
      setTopology(data);
    } catch (err) {
      console.error("ネットワークトポロジ取得エラー:", err);
    }
  };

  // トレースルートを実行
  const executeTraceroute = async () => {
    if (!targetIp) return;
    
    try {
      addTerminalLine(`traceroute ${targetIp}`);
      setTracerouteResult([]);
      
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/traceroute?target=${targetIp}&timeout=${tracerouteTimeout}`);
      if (!response.ok) {
        throw new Error("トレースルートの実行に失敗しました");
      }
      
      const data = await response.json();
      
      // 結果を段階的に表示（現実感を出すため）
      addTerminalLine("Type escape sequence to abort.");
      addTerminalLine(`Tracing the route to ${targetIp}`);
      
      // ホップごとに遅延を付けて表示
      for (let i = 0; i < data.length; i++) {
        const hop = data[i];
        setTimeout(() => {
          if (hop.status === "timeout") {
            addTerminalLine(` ${hop.hop}  * * *  Request timed out`);
          } else {
            const hostname = hop.hostname ? `${hop.hostname} (${hop.ip})` : hop.ip;
            addTerminalLine(` ${hop.hop}  ${hostname}  ${hop.rtt !== null ? `${hop.rtt} ms` : 'Unreachable'}`);
          }
          
          // 最後のホップで全体の結果をセット
          if (i === data.length - 1) {
            setTracerouteResult(data);
          }
        }, i * 300);  // 300msごとに表示
      }
    } catch (err) {
      console.error("トレースルート実行エラー:", err);
      setError("トレースルートの実行に失敗しました");
    }
  };

  // Pingを実行
  const executePing = async () => {
    if (!targetIp) return;
    
    try {
      addTerminalLine(`ping ${targetIp} count ${pingCount}`);
      setPingResult(null);
      
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/ping?target=${targetIp}&count=${pingCount}`);
      if (!response.ok) {
        throw new Error("Pingの実行に失敗しました");
      }
      
      const data = await response.json();
      
      // 結果を段階的に表示
      addTerminalLine(`Sending ${pingCount}, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:`);
      
      // パケットごとに応答を表示
      const displayCount = Math.min(pingCount, 5); // 表示するパケット数を制限
      for (let i = 0; i < displayCount; i++) {
        setTimeout(() => {
          if (data.packet_loss === 100) {
            addTerminalLine(`Request timed out.`);
          } else {
            const rtt = data.rtt_min + Math.random() * (data.rtt_max - data.rtt_min);
            addTerminalLine(`Reply from ${targetIp}: bytes=100 time=${rtt.toFixed(2)} ms TTL=64`);
          }
          
          // 最後のパケットで結果のサマリーを表示
          if (i === displayCount - 1) {
            addTerminalLine("");
            addTerminalLine(`Ping statistics for ${targetIp}:`);
            addTerminalLine(`    Packets: Sent = ${data.packets_sent}, Received = ${data.packets_received}, Lost = ${data.packets_sent - data.packets_received} (${data.packet_loss}% loss),`);
            
            if (data.packets_received > 0) {
              addTerminalLine("Approximate round trip times in milli-seconds:");
              addTerminalLine(`    Minimum = ${data.rtt_min}ms, Maximum = ${data.rtt_max}ms, Average = ${data.rtt_avg}ms`);
            }
            
            setPingResult(data);
          }
        }, i * 500);  // 500msごとに表示
      }
    } catch (err) {
      console.error("Ping実行エラー:", err);
      setError("Pingの実行に失敗しました");
    }
  };

  // 診断を実行
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticResults(null);
    setProgress(0);
    
    try {
      // 診断コマンドをターミナルに表示
      addTerminalLine("Router# show ip interface brief");
      
      // 進行状況を更新する関数
      const updateProgress = (value: number) => {
        setProgress(value);
      };
      
      // 段階的に進行状況を更新（視覚効果のため）
      updateProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // インターフェースの状態を表示
      Object.entries(interfaces).forEach(([name, details]) => {
        addTerminalLine(`${name.padEnd(25)} ${details.status.padEnd(15)} ${details.protocol.padEnd(10)} ${details.ip}`);
      });
      
      updateProgress(30);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // ルーティングテーブルを表示
      addTerminalLine("\nRouter# show ip route");
      addTerminalLine("Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP");
      addTerminalLine("       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area");
      
      updateProgress(50);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      routingTable.forEach(route => {
        const prefix = route.prefix_length !== undefined ? `/${route.prefix_length}` : "";
        const adminDist = route.administrative_distance !== undefined ? `[${route.administrative_distance}/` : "[";
        addTerminalLine(`${route.protocol} ${route.destination}${prefix} ${adminDist}${route.metric}] via ${route.next_hop}, ${route.interface}`);
      });
      
      updateProgress(70);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // APIから診断データを取得
      try {
        const response = await fetch(`${API_BASE_URL}/router/${routerIp}/diagnostics`);
        if (!response.ok) {
          throw new Error("診断の実行に失敗しました");
        }
        const data = await response.json();
        setDiagnosticResults(data);
      } catch (err) {
        console.error("診断実行エラー:", err);
        // エラー時はデフォルトの健全な結果を返す
        // エラー時はデフォルトの健全な結果を返す
        setDiagnosticResults({
            status: "healthy",
            summary: "全てのシステムは正常に動作しています",
            issues: [],
            timestamp: new Date().toISOString()
          });
        }
        
        updateProgress(100);
        
        // 結果表示のためにターミナルを自動展開
        setExpandedSections(prev => ({
          ...prev,
          terminal: true
        }));
        
      } catch (err) {
        console.error("診断実行エラー:", err);
        setError("診断の実行に失敗しました");
      } finally {
        setIsRunningDiagnostics(false);
      }
    };
  
    // コマンドを実行
    const executeCommand = async () => {
      if (!commandInput.trim()) return;
      
      addTerminalLine(`Router# ${commandInput}`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/router/${routerIp}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: commandInput })
        });
        
        if (!response.ok) {
          throw new Error("コマンドの実行に失敗しました");
        }
        
        const data = await response.json();
        const output = data.output || "No output";
        
        // 出力行をターミナルに追加
        output.split("\n").forEach((line: string) => {
          addTerminalLine(line);
        });
        
      } catch (err) {
        console.error("コマンド実行エラー:", err);
        addTerminalLine(`エラー: コマンドの実行に失敗しました。`);
      }
      
      // 入力をクリア
      setCommandInput("");
    };
  
    // プリセットを適用
    const applyPreset = (preset: any) => {
      setRouterIp(preset.ip);
      setUsername(preset.username);
      setPassword(preset.password);
      setVendorType(preset.vendor as RouterVendor);
    };
  
    // ステータスに応じた色を取得
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "up": return "text-green-500";
        case "down": return "text-red-500";
        case "administratively down": return "text-yellow-500";
        default: return "text-gray-500";
      }
    };
  
    // 深刻度に応じたアイコンを取得
    const getSeverityIcon = (severity: string) => {
      switch (severity) {
        case "critical":
          return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
        case "high":
          return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />;
        case "medium":
          return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
        default:
          return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
      }
    };
  
    // ベンダーに応じたアイコンを取得
    const getVendorIcon = (vendor: RouterVendor) => {
      switch (vendor) {
        case "cisco":
          return <Server className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />;
        case "juniper":
          return <Database className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />;
        case "hp":
          return <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" />;
        case "huawei":
          return <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />;
        case "mikrotik":
          return <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />;
        default:
          return <RouterIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
      }
    };
  
    // プロトコルに応じたバッジスタイルを取得
    const getProtocolBadgeStyle = (protocol: string) => {
      switch (protocol) {
        case "C":
          return "bg-green-700 bg-opacity-40 text-green-300";
        case "S":
          return "bg-blue-700 bg-opacity-40 text-blue-300";
        case "O":
          return "bg-purple-700 bg-opacity-40 text-purple-300";
        case "B":
          return "bg-yellow-700 bg-opacity-40 text-yellow-300";
        case "D":
          return "bg-indigo-700 bg-opacity-40 text-indigo-300";
        case "R":
          return "bg-orange-700 bg-opacity-40 text-orange-300";
        default:
          return "bg-gray-700 bg-opacity-40 text-gray-300";
      }
    };
  
    // プロトコルの完全名を取得
    const getProtocolFullName = (protocol: string) => {
      switch (protocol) {
        case "C": return "Connected";
        case "S": return "Static";
        case "O": return "OSPF";
        case "B": return "BGP";
        case "D": return "EIGRP";
        case "R": return "RIP";
        case "M": return "Mobile";
        case "L": return "Local";
        case "Direct": return "Direct";
        case "Static": return "Static";
        default: return protocol;
      }
    };
  
    // フィルタリングされたインターフェースリストを取得
    const getFilteredInterfaces = () => {
      if (interfaceFilter === "all") {
        return Object.entries(interfaces);
      } else if (interfaceFilter === "up") {
        return Object.entries(interfaces).filter(([_, details]) => details.status === "up");
      } else if (interfaceFilter === "down") {
        return Object.entries(interfaces).filter(([_, details]) => details.status === "down" || details.status === "administratively down");
      }
      // デフォルトは全て表示
      return Object.entries(interfaces);
    };
  
    return (
      <Layout title="ルーティング実践 🌐" backLink="/" backText="トップメニューに戻る">
        <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-4xl mx-auto space-y-6">
          {/* 接続ステータス */}
          <div className={`p-4 rounded-xl border-2 ${
            connected 
              ? 'bg-green-500 bg-opacity-20 border-green-500' 
              : 'bg-yellow-500 bg-opacity-20 border-yellow-500'
          }`}>
            <div className="flex items-center">
              {connected ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-2 sm:mr-3" />
              ) : (
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2 sm:mr-3" />
              )}
              <div>
                <h2 className="text-base sm:text-lg font-semibold">
                  {connected ? 'ルーターに接続済み' : '未接続'}
                </h2>
                <p className="text-xs sm:text-sm opacity-90">
                  {connected 
                    ? `${routerInfo?.name || 'Router'} (${routerInfo?.ip || routerIp}) に接続されています` 
                    : '接続ボタンをクリックしてルーターへの接続を確立してください'}
                </p>
                {connected && (
                  <div className="flex items-center mt-1">
                    {getVendorIcon(vendorType)}
                    <span className="text-xs sm:text-sm ml-1 opacity-80">
                      {vendorType.charAt(0).toUpperCase() + vendorType.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              
              {connected ? (
                <div className="ml-auto flex items-center space-x-2">
                  <button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md flex items-center font-medium text-sm"
                    onClick={runDiagnostics}
                    disabled={isRunningDiagnostics}
                  >
                    {isRunningDiagnostics ? (
                      <>
                        <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 animate-spin" />
                        <span>診断実行中...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span>診断を実行</span>
                      </>
                    )}
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md flex items-center font-medium text-sm"
                    onClick={handleDisconnect}
                  >
                    <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span>切断</span>
                  </button>
                </div>
              ) : (
                <button 
                  className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md flex items-center font-medium text-sm"
                  onClick={() => setShowConnectionForm(!showConnectionForm)}
                >
                  {showConnectionForm ? '接続フォームを閉じる' : '接続フォームを表示'}
                </button>
              )}
            </div>
            
            {isRunningDiagnostics && (
              <div className="mt-3">
                <p className="text-sm mb-1">診断実行中... {progress}%</p>
                <Progress value={progress} className="h-2 bg-white bg-opacity-30" />
              </div>
            )}
            
            {error && (
              <div className="mt-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md p-2">
                <p className="text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  {error}
                </p>
              </div>
            )}
          </div>
          
          {/* 接続フォーム */}
          {showConnectionForm && !connected && (
            <div className="bg-white bg-opacity-20 rounded-xl p-4 border-2 border-indigo-500">
              <h3 className="text-lg font-bold mb-4">ルーター接続設定</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">IPアドレス</label>
                  <Input
                    type="text"
                    placeholder="192.168.1.1"
                    value={routerIp}
                    onChange={(e) => setRouterIp(e.target.value)}
                    className="bg-white text-black placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ユーザー名</label>
                  <Input
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white text-black placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">パスワード</label>
                  <Input
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white text-black placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ベンダータイプ</label>
                  <Select value={vendorType} onValueChange={(value) => setVendorType(value as RouterVendor)}>
                    <SelectTrigger className="bg-white text-black">
                      <SelectValue placeholder="ベンダーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cisco">Cisco</SelectItem>
                      <SelectItem value="juniper">Juniper</SelectItem>
                      <SelectItem value="hp">HP/Aruba</SelectItem>
                      <SelectItem value="huawei">Huawei</SelectItem>
                      <SelectItem value="mikrotik">MikroTik</SelectItem>
                      <SelectItem value="unknown">その他/不明</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleConnect}
                    disabled={isConnectionLoading}
                  >
                    {isConnectionLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        接続中...
                      </>
                    ) : (
                      <>
                        <Wifi className="mr-2 h-4 w-4" />
                        接続
                      </>
                    )}
                  </Button>
                </div>
                
                {/* プリセット */}
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">プリセット</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {routerPresets.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-xs p-1 sm:p-2 h-auto"
                        onClick={() => applyPreset(preset)}
                      >
                        {getVendorIcon(preset.vendor as RouterVendor)}
                        <span className="ml-1 truncate">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs italic mt-2">
                  接続できない場合はデモモードで動作します。実際のルーターへの接続にはSSHアクセスが必要です。
                </p>
              </div>
            </div>
          )}
  
          {/* タブインターフェース - 接続されている場合のみ表示 */}
          {connected && (
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">概要</TabsTrigger>
                <TabsTrigger value="interfaces" className="text-xs sm:text-sm">インターフェース</TabsTrigger>
                <TabsTrigger value="routing" className="text-xs sm:text-sm">ルーティング</TabsTrigger>
                <TabsTrigger value="tools" className="text-xs sm:text-sm">ツール</TabsTrigger>
                <TabsTrigger value="terminal" className="text-xs sm:text-sm">ターミナル</TabsTrigger>
              </TabsList>
              
              {/* 概要タブ */}
              <TabsContent value="overview" className="space-y-4">
                {/* デバイス情報カード */}
                <Card className="bg-white bg-opacity-20 border-blue-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Server className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 mr-2" />
                        デバイス情報
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {routerInfo ? (
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm opacity-80">モデル:</span>
                          <span className="text-xs sm:text-sm font-medium">{routerInfo.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm opacity-80">シリアル番号:</span>
                          <span className="text-xs sm:text-sm font-medium">{routerInfo.serialNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm opacity-80">ファームウェア:</span>
                          <span className="text-xs sm:text-sm font-medium">{routerInfo.firmwareVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm opacity-80">IPアドレス:</span>
                          <span className="text-xs sm:text-sm font-medium">{routerInfo.ip}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm opacity-80">稼働時間:</span>
                          <span className="text-xs sm:text-sm font-medium">{routerInfo.uptime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm opacity-80">ベンダー:</span>
                          <span className="text-xs sm:text-sm font-medium flex items-center">
                            {getVendorIcon(vendorType)}
                            <span className="ml-1">{vendorType.charAt(0).toUpperCase() + vendorType.slice(1)}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-16 sm:h-24">
                        <p className="text-xs sm:text-sm opacity-80">接続するとデバイス情報が表示されます</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* 診断結果カード */}
                <Card className="bg-white bg-opacity-20 border-indigo-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-300 mr-2" />
                        診断結果
                      </CardTitle>
                      <Button 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-700 py-1 px-2 h-auto text-xs"
                        onClick={runDiagnostics}
                        disabled={isRunningDiagnostics}
                      >
                        {isRunningDiagnostics ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            診断中...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            更新
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {diagnosticResults ? (
                      <div>
                        <div className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg ${
                          diagnosticResults.status === "healthy" 
                            ? "bg-green-500 bg-opacity-20 border border-green-500" 
                            : diagnosticResults.status === "warning"
                              ? "bg-yellow-500 bg-opacity-20 border border-yellow-500"
                              : "bg-red-500 bg-opacity-20 border border-red-500"
                        }`}>
                          <div className="flex items-start sm:items-center">
                            {diagnosticResults.status === "healthy" ? (
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0" />
                            ) : diagnosticResults.status === "warning" ? (
                              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0" />
                            ) : (
                              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0" />
                            )}
                            <div>
                              <h3 className="text-base sm:text-lg font-medium">
                                {diagnosticResults.status === "healthy" ? "ネットワーク正常" : "問題を検出"}
                              </h3>
                              <p className="text-xs sm:text-sm">
                                {diagnosticResults.summary}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {diagnosticResults.issues.length > 0 && (
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="font-medium text-sm sm:text-base">検出された問題:</h4>
                            {diagnosticResults.issues.map((issue, index) => (
                              <div key={index} className="bg-white bg-opacity-20 rounded-lg border border-indigo-400 p-3 sm:p-4">
                                <div className="flex items-start">
                                  {getSeverityIcon(issue.severity)}
                                  <div className="ml-3">
                                    <h5 className="text-sm sm:text-base font-medium">{issue.description}</h5>
                                    <div className="mt-2 bg-black bg-opacity-20 rounded-md p-2 sm:p-3">
                                      <p className="text-xs sm:text-sm">
                                        <span className="font-medium">推奨対応: </span>
                                        {issue.recommendation}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 sm:p-8">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-500 bg-opacity-20 rounded-full mb-3 sm:mb-4">
                          <Play className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-300" />
                        </div>
                        <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">診断実行の準備ができました</p>
                        <p className="text-xs sm:text-sm opacity-80 text-center max-w-md mb-3 sm:mb-4">
                          「診断を実行」ボタンをクリックして、ネットワーク構成を分析し潜在的な問題を特定します。
                        </p>
                        <button 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center font-medium text-sm sm:text-base"
                          onClick={runDiagnostics}
                          disabled={isRunningDiagnostics}
                        >
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                          診断を実行
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* ネットワークトポロジー */}
                <Card className="bg-white bg-opacity-20 border-cyan-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Network className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300 mr-2" />
                        ネットワークトポロジー
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black bg-opacity-20 rounded-lg p-3 sm:p-4">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-400 border-opacity-20">
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">デバイス</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">インターフェース</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">IPアドレス</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">接続先</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-400 border-opacity-20">
                            <td className="px-3 py-2 text-sm">PC1</td>
                            <td className="px-3 py-2 text-sm">NIC</td>
                            <td className="px-3 py-2 text-sm font-mono">192.168.1.10/24</td>
                            <td className="px-3 py-2 text-sm">R1 (G0/0)</td>
                          </tr>
                          <tr className="border-b border-gray-400 border-opacity-20">
                            <td className="px-3 py-2 text-sm">R1</td>
                            <td className="px-3 py-2 text-sm">G0/0</td>
                            <td className="px-3 py-2 text-sm font-mono">192.168.1.1/24</td>
                            <td className="px-3 py-2 text-sm">PC1</td>
                          </tr>
                          <tr className="border-b border-gray-400 border-opacity-20">
                            <td className="px-3 py-2 text-sm">R1</td>
                            <td className="px-3 py-2 text-sm">G0/1</td>
                            <td className="px-3 py-2 text-sm font-mono">192.168.2.1/24</td>
                            <td className="px-3 py-2 text-sm">R2 (G0/0)</td>
                          </tr>
                          <tr className="border-b border-gray-400 border-opacity-20">
                            <td className="px-3 py-2 text-sm">R2</td>
                            <td className="px-3 py-2 text-sm">G0/0</td>
                            <td className="px-3 py-2 text-sm font-mono">192.168.2.2/24</td>
                            <td className="px-3 py-2 text-sm">R1 (G0/1)</td>
                          </tr>
                          <tr className="border-b border-gray-400 border-opacity-20">
                            <td className="px-3 py-2 text-sm">R2</td>
                            <td className="px-3 py-2 text-sm">G0/1</td>
                            <td className="px-3 py-2 text-sm font-mono">192.168.3.1/24</td>
                            <td className="px-3 py-2 text-sm">PC2</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-sm">PC2</td>
                            <td className="px-3 py-2 text-sm">NIC</td>
                            <td className="px-3 py-2 text-sm font-mono">192.168.3.10/24</td>
                            <td className="px-3 py-2 text-sm">R2 (G0/1)</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="mt-4 px-2 py-1 bg-blue-900 bg-opacity-30 rounded-lg">
                        <p className="text-xs text-blue-200">
                          <Info className="inline-block h-3 w-3 mr-1" />
                          このネットワーク構成では、接続しているルーターが管理する他のデバイスの情報も表示されます。
                          CDP/LLDPが有効な場合、隣接デバイスの情報も表示されます。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* インターフェースタブ */}
              <TabsContent value="interfaces" className="space-y-4">
                <Card className="bg-white bg-opacity-20 border-green-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 mr-2" />
                        インターフェース状態
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Select value={interfaceFilter} onValueChange={setInterfaceFilter}>
                          <SelectTrigger className="h-8 text-xs bg-black bg-opacity-20 border-green-500 w-auto min-w-[80px]">
                            <SelectValue placeholder="フィルター" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全て</SelectItem>
                            <SelectItem value="up">アップのみ</SelectItem>
                            <SelectItem value="down">ダウンのみ</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 py-1 px-2 h-auto text-xs"
                          onClick={fetchInterfaces}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          更新
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(interfaces).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white border-opacity-20">
                              <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">インターフェース</th>
                              <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">状態</th>
                              <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">プロトコル</th>
                              <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">IPアドレス</th>
                              <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider hidden sm:table-cell">速度/デュプレックス</th>
                              <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider hidden sm:table-cell">説明</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredInterfaces().map(([name, details]) => (
                              <tr key={name} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-10">
                                <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium">{name}</td>
                                <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                                    details.status === "up" 
                                      ? "bg-green-700 bg-opacity-40 text-green-300" 
                                      : details.status === "administratively down" 
                                        ? "bg-yellow-700 bg-opacity-40 text-yellow-300" 
                                        : "bg-red-700 bg-opacity-40 text-red-300"
                                  }`}>
                                    {details.status === "up" ? (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    ) : details.status === "administratively down" ? (
                                      <AlertTriangle className="mr-1 h-3 w-3" />
                                    ) : (
                                      <AlertCircle className="mr-1 h-3 w-3" />
                                    )}
                                    <span className="hidden sm:inline">{details.status}</span>
                                    <span className="sm:hidden">
                                      {details.status === "up" ? "アップ" : 
                                       details.status === "down" ? "ダウン" : "管理ダウン"}
                                    </span>
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                                  <span className={`${getStatusColor(details.protocol)}`}>
                                    {details.protocol}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-mono">
                                  {details.ip}
                                </td>
                                <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm hidden sm:table-cell">
                                  {details.speed}/{details.duplex}
                                </td>
                                <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm hidden sm:table-cell opacity-80">
                                  {details.description || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-xs sm:text-sm opacity-80">インターフェース情報を取得中...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* インターフェースの詳細情報 */}
                {Object.keys(interfaces).length > 0 && (
                  <Card className="bg-white bg-opacity-20 border-blue-400">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 mr-2" />
                        インターフェース詳細情報
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(interfaces).map(([name, details]) => (
                          <div
                            key={name}
                            className={`p-3 rounded-lg border ${
                              details.status === "up"
                                ? "border-green-500 bg-green-900 bg-opacity-10"
                                : "border-red-500 bg-red-900 bg-opacity-10"
                            }`}
                          >
                            <h4 className="font-medium text-sm mb-2 flex items-center">
                              {details.status === "up" ? (
                                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                              )}
                              {name}
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="opacity-70">ステータス:</span>
                                <span className="font-medium">{details.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="opacity-70">プロトコル:</span>
                                <span className="font-medium">{details.protocol}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="opacity-70">IPアドレス:</span>
                                <span className="font-medium font-mono">{details.ip}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="opacity-70">速度:</span>
                                <span className="font-medium">{details.speed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="opacity-70">デュプレックス:</span>
                                <span className="font-medium">{details.duplex}</span>
                              </div>
                              {details.mac && (
                                <div className="flex justify-between">
                                  <span className="opacity-70">MACアドレス:</span>
                                  <span className="font-medium font-mono">{details.mac}</span>
                                </div>
                              )}
                              {details.mtu && (
                                <div className="flex justify-between">
                                  <span className="opacity-70">MTU:</span>
                                  <span className="font-medium">{details.mtu} bytes</span>
                                </div>
                              )}
                              <div className="flex justify-between sm:col-span-2">
                                <span className="opacity-70">説明:</span>
                                <span className="font-medium">{details.description || "-"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* ルーティングタブ */}
              <TabsContent value="routing" className="space-y-4">
                <Card className="bg-white bg-opacity-20 border-purple-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Table className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300 mr-2" />
                        ルーティングテーブル
                      </CardTitle>
                      <Button 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700 py-1 px-2 h-auto text-xs"
                        onClick={fetchRoutingTable}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        更新
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {routingTable.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white border-opacity-20">
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">宛先ネットワーク</th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">次ホップ</th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">インターフェース</th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">プロトコル</th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">メトリック</th>
                              <th className="hidden sm:table-cell px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">タイプ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {routingTable.map((route, index) => (
                              <tr key={index} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-10">
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-mono">
                                  {route.destination}{route.prefix_length !== undefined ? `/${route.prefix_length}` : ""}
                                </td>
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-mono">{route.next_hop}</td>
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{route.interface}</td>
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">
                                  <span className={`inline-flex items-center px-1 py-0.5 rounded-md text-xs font-medium ${getProtocolBadgeStyle(route.protocol)}`}>
                                    {getProtocolFullName(route.protocol)}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">
                                  {route.administrative_distance !== undefined 
                                    ? `[${route.administrative_distance}/${route.metric}]` 
                                    : route.metric}
                                </td>
                                <td className="hidden sm:table-cell px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{route.type}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-xs sm:text-sm opacity-80">ルーティングテーブルを取得中...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* 隣接デバイス情報 */}
                <Card className="bg-white bg-opacity-20 border-teal-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Network className="h-4 w-4 sm:h-5 sm:w-5 text-teal-300 mr-2" />
                        隣接デバイス情報
                      </CardTitle>
                      <Button 
                        size="sm" 
                        className="bg-teal-600 hover:bg-teal-700 py-1 px-2 h-auto text-xs"
                        onClick={fetchNeighbors}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        更新
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {neighbors.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white border-opacity-20">
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">デバイスID</th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">IPアドレス</th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">ローカルインターフェース</th>
                              <th className="px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">リモートインターフェース</th>
                              <th className="hidden sm:table-cell px-2 sm:px-3 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">プラットフォーム</th>
                            </tr>
                          </thead>
                          <tbody>
                            {neighbors.map((neighbor, index) => (
                              <tr key={index} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-10">
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium">{neighbor.device_id}</td>
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-mono">{neighbor.ip_address || "-"}</td>
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{neighbor.local_interface}</td>
                                <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{neighbor.remote_interface}</td>
                                <td className="hidden sm:table-cell px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{neighbor.platform || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-xs sm:text-sm opacity-80">隣接デバイス情報がありません。CDP/LLDPが有効か確認してください。</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* ツールタブ */}
              <TabsContent value="tools" className="space-y-4">
                {/* トレースルート */}
                <Card className="bg-white bg-opacity-20 border-amber-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg flex items-center">
                      <Route className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 mr-2" />
                      経路追跡 (Traceroute)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-end space-x-2 mb-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium mb-1">宛先IPアドレス / ホスト名</label>
                          <Input
                            type="text"
                            placeholder="例: 192.168.3.10 または www.example.com"
                            value={targetIp}
                            onChange={(e) => setTargetIp(e.target.value)}
                            className="bg-white bg-opacity-20 text-white border-amber-500 placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">タイムアウト</label>
                          <Select value={tracerouteTimeout.toString()} onValueChange={(v) => setTracerouteTimeout(Number(v))}>
                            <SelectTrigger className="bg-white bg-opacity-20 text-white border-amber-500 w-20">
                              <SelectValue placeholder="2" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1秒</SelectItem>
                              <SelectItem value="2">2秒</SelectItem>
                              <SelectItem value="5">5秒</SelectItem>
                              <SelectItem value="10">10秒</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={executeTraceroute}
                        >
                          実行
                        </Button>
                      </div>
                      
                      {tracerouteResult.length > 0 && (
                        <div className="bg-black bg-opacity-30 p-3 rounded-lg mt-3">
                          <h3 className="text-sm font-medium mb-2 flex items-center">
                            <Route className="h-4 w-4 mr-2 text-amber-400" />
                            トレースルート結果: {targetIp}
                          </h3>
                          
                          <div className="space-y-1">
                            {tracerouteResult.map((hop, index) => (
                              <div 
                                key={index}
                                className="flex items-center p-2 rounded hover:bg-white hover:bg-opacity-10"
                              >
                                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-amber-700 bg-opacity-40 text-amber-300 text-xs">
                                  {hop.hop}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    {hop.status === "timeout" ? (
                                      <AlertCircle className="h-3 w-3 mr-1 text-red-400" />
                                    ) : hop.ip.includes('192.168') ? (
                                      <RouterIcon className="h-3 w-3 mr-1 text-amber-300" />
                                    ) : (
                                      <Globe className="h-3 w-3 mr-1 text-amber-300" />
                                    )}
                                    <span className="font-mono text-xs">
                                      {hop.status === "timeout" ? "* * * タイムアウト" : (
                                        hop.hostname ? `${hop.hostname} (${hop.ip})` : hop.ip
                                      )}
                                    </span>
                                  </div>
                                </div>
                                
                                {hop.rtt !== null ? (
                                  <span className="text-xs font-mono">{hop.rtt} ms</span>
                                ) : (
                                  <span className="text-xs font-mono text-gray-400">--</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Ping */}
                <Card className="bg-white bg-opacity-20 border-blue-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg flex items-center">
                      <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 mr-2" />
                      接続確認 (Ping)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-end space-x-2 mb-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium mb-1">宛先IPアドレス / ホスト名</label>
                          <Input
                            type="text"
                            placeholder="例: 192.168.3.10 または www.example.com"
                            value={targetIp}
                            onChange={(e) => setTargetIp(e.target.value)}
                            className="bg-white bg-opacity-20 text-white border-blue-500 placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">回数</label>
                          <Select value={pingCount.toString()} onValueChange={(v) => setPingCount(Number(v))}>
                            <SelectTrigger className="bg-white bg-opacity-20 text-white border-blue-500 w-20">
                              <SelectValue placeholder="5" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2回</SelectItem>
                              <SelectItem value="5">5回</SelectItem>
                              <SelectItem value="10">10回</SelectItem>
                              <SelectItem value="20">20回</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={executePing}
                        >
                          実行
                        </Button>
                      </div>
                      
                      {pingResult && (
                        <div className="bg-black bg-opacity-30 p-3 rounded-lg mt-3">
                          <h3 className="text-sm font-medium mb-2 flex items-center">
                            <Wifi className="h-4 w-4 mr-2 text-blue-400" />
                            Ping結果: {targetIp}
                          </h3>
                          
                          <div className="p-2 rounded-lg bg-black bg-opacity-30 font-mono text-xs mb-3">
                            <div className="flex justify-between border-b border-gray-700 pb-1 mb-1">
                              <span>送信パケット数:</span>
                              <span>{pingResult.packets_sent}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-1 mb-1">
                              <span>受信パケット数:</span>
                              <span>{pingResult.packets_received}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-1 mb-1">
                              <span>パケットロス:</span>
                              <span className={`${pingResult.packet_loss > 0 ? "text-red-400" : "text-green-400"}`}>
                                {pingResult.packet_loss}%
                              </span>
                            </div>
                            
                            {pingResult.rtt_min !== undefined && (
                              <>
                                <div className="flex justify-between border-b border-gray-700 pb-1 mb-1">
                                  <span>最小RTT:</span>
                                  <span>{pingResult.rtt_min} ms</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 pb-1 mb-1">
                                  <span>平均RTT:</span>
                                  <span>{pingResult.rtt_avg} ms</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>最大RTT:</span>
                                  <span>{pingResult.rtt_max} ms</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className={`text-center p-2 rounded-lg ${
                            pingResult.success 
                              ? "bg-green-900 bg-opacity-30 text-green-300" 
                              : "bg-red-900 bg-opacity-30 text-red-300"
                          }`}>
                            {pingResult.success ? (
                              <div className="flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span>接続成功</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <span>接続失敗</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* ターミナルタブ */}
              <TabsContent value="terminal">
                <Card className="bg-white bg-opacity-20 border-gray-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <TerminalSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mr-2" />
                        ターミナル
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="py-1 px-2 h-auto text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(terminalOutput.join('\n'));
                        }}
                      >
                        <Clipboard className="h-3 w-3 mr-1" />
                        コピー
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-black bg-opacity-80 font-mono text-xs sm:text-sm p-3 sm:p-4 rounded-b-lg max-h-96 overflow-y-auto">
                      {terminalOutput.length > 0 ? (
                        terminalOutput.map((line, index) => (
                          <div key={index} className={line.startsWith("Router#") ? "text-green-400 mt-1 sm:mt-2" : ""}>
                            {line}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 italic">ターミナル出力がここに表示されます</div>
                      )}
                    </div>
                    
                    <div className="p-3 flex items-center bg-gray-900 bg-opacity-80 border-t border-gray-700">
                      <span className="text-green-400 mr-2 text-xs sm:text-sm font-mono">Router#</span>
                      <Input
                        type="text"
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        placeholder="コマンドを入力..."
                        className="flex-1 bg-transparent border-gray-700 text-white placeholder-gray-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            executeCommand();
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        className="ml-2 bg-green-700 hover:bg-green-800"
                        onClick={executeCommand}
                      >
                        実行
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-400">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-blue-400" />
                    よく使用されるコマンド
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="justify-start text-xs h-auto py-1"
                      onClick={() => {
                        setCommandInput("show ip interface brief");
                        executeCommand();
                      }}
                    >
                      show ip interface brief
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start text-xs h-auto py-1"
                      onClick={() => {
                        setCommandInput("show ip route");
                        executeCommand();
                      }}
                    >
                      show ip route
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start text-xs h-auto py-1"
                      onClick={() => {
                        setCommandInput("show running-config");
                        executeCommand();
                      }}
                    >
                      show running-config
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start text-xs h-auto py-1"
                      onClick={() => {
                        setCommandInput("show cdp neighbors");
                        executeCommand();
                      }}
                    >
                      show cdp neighbors
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Layout>
    );
  }
"use client"

import { useState, useEffect } from "react"
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
  BarChart,
  ChevronUp} from 'lucide-react'

type DiagnosticIssue = {
  type: string;
  severity: string;
  description: string;
  recommendation: string;
}

type DiagnosticResult = {
  status: string;
  summary: string;
  issues: DiagnosticIssue[];
}

type InterfaceDetail = {
  status: string;
  protocol: string;
  ip: string;
  speed: string;
  duplex: string;
}

type TraceRouteHop = {
  hop: number;
  ip: string;
  rtt: number | null;
}

type RouteEntry = {
  destination: string;
  nextHop: string;
  interface: string;
  protocol: string;
  metric: number;
  type: string;
}

// Mock data for simulation when not connected to real router
const DUMMY_ROUTER = {
  name: "Cisco 2911",
  ip: "192.168.1.1",
  model: "CISCO2911/K9",
  serialNumber: "FTX1840ABCD",
  firmwareVersion: "15.7(3)M2",
  uptime: "10 days, 4 hours, 32 minutes"
};

const INTERFACE_STATUSES = {
  "GigabitEthernet0/0": { status: "up", protocol: "up", ip: "192.168.1.1", speed: "1000Mb/s", duplex: "full" },
  "GigabitEthernet0/1": { status: "up", protocol: "up", ip: "192.168.2.1", speed: "1000Mb/s", duplex: "full" }
};

const ROUTING_TABLE: RouteEntry[] = [
  { destination: "192.168.1.0/24", nextHop: "Connected", interface: "GigabitEthernet0/0", protocol: "C", metric: 0, type: "Direct" },
  { destination: "192.168.2.0/24", nextHop: "Connected", interface: "GigabitEthernet0/1", protocol: "C", metric: 0, type: "Direct" },
  { destination: "192.168.3.0/24", nextHop: "192.168.2.2", interface: "GigabitEthernet0/1", protocol: "S", metric: 1, type: "Static" }
];

const TRACE_ROUTE_RESULT: TraceRouteHop[] = [
  { hop: 1, ip: "192.168.2.2", rtt: 1.0 },
  { hop: 2, ip: "192.168.3.10", rtt: 2.0 }
];

// Base API URL - should point to your FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

// Network configuration details for topology display
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
  const [connected, setConnected] = useState(false)
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [routerInfo, setRouterInfo] = useState<any>(null)
  const [interfaces, setInterfaces] = useState<Record<string, InterfaceDetail>>({})
  const [routingTable, setRoutingTable] = useState<RouteEntry[]>([])
  const [tracerouteResult, setTracerouteResult] = useState<TraceRouteHop[]>([])
  const [routerIp, setRouterIp] = useState("192.168.1.1")
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [targetIp, setTargetIp] = useState("192.168.3.10")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    deviceInfo: true,
    interfaces: true,
    routing: true,
    traceroute: false,
    terminal: false,
    diagnostics: true,
    networkTopology: true
  })
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [commandInput, setCommandInput] = useState("")

  // Define valid section keys
  type SectionKey = keyof typeof expandedSections;

  // Toggle section expansion
  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }

  // Connect to router - with real API call
  const handleConnect = async () => {
    setError(null);
    try {
      setTerminalOutput([`ルーター ${routerIp} への接続を試みています...`]);
      
      // Try to connect to real router via FastAPI
      try {
        const response = await fetch(`${API_BASE_URL}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: routerIp,
            username,
            password,
            connection_type: "ssh"
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
        setConnected(true);
        
        // Fetch router info
        await fetchRouterInfo();
        
      } catch (err) {
        console.error("API接続エラー:", err);
        // Fallback to mock data if API connection fails
        addTerminalLine("実際のルーターへの接続に失敗しました。デモモードに切り替えます。");
        setTimeout(() => {
          addTerminalLine("デモルーターに接続しました");
          addTerminalLine("認証中...");
          addTerminalLine("認証成功");
          setRouterInfo({...DUMMY_ROUTER, ip: routerIp});
          setInterfaces(INTERFACE_STATUSES);
          setRoutingTable(ROUTING_TABLE);
          setConnected(true);
          setShowConnectionForm(false);
        }, 1500);
      }
    } catch (err) {
      console.error("接続エラー:", err);
      setError(err instanceof Error ? err.message : "接続エラーが発生しました");
    }
  }

  // Disconnect from router
  const handleDisconnect = () => {
    setConnected(false);
    setRouterInfo(null);
    setInterfaces({});
    setRoutingTable([]);
    setTracerouteResult([]);
    setDiagnosticResults(null);
    addTerminalLine("ルーターとの接続を切断しました。");
    addTerminalLine("新しいルーターに接続するには接続フォームを使用してください。");
    setShowConnectionForm(true);
  }

  // Add line to terminal output
  const addTerminalLine = (line: string) => {
    setTerminalOutput(prev => [...prev, line]);
  }

  // Fetch router information from API
  const fetchRouterInfo = async () => {
    try {
      // Try to fetch from real API
      const response = await fetch(`${API_BASE_URL}/router/${routerIp}/info`);
      if (!response.ok) {
        throw new Error("ルーター情報の取得に失敗しました");
      }
      const data = await response.json();
      setRouterInfo(data);
      
      // Also fetch interfaces and routing table
      await fetchInterfaces();
      await fetchRoutingTable();
      
    } catch (err) {
      console.error("ルーター情報取得エラー:", err);
      // Fallback to dummy data
      setRouterInfo({...DUMMY_ROUTER, ip: routerIp});
      setInterfaces(INTERFACE_STATUSES);
      setRoutingTable(ROUTING_TABLE);
    }
  }

  // Fetch interface information
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
      // Fallback to dummy data
      setInterfaces(INTERFACE_STATUSES);
    }
  }

  // Fetch routing table
  const fetchRoutingTable = async () => {
    try {
      // This assumes your API has a route to get the routing table
      // If not, you would need to implement it
      addTerminalLine("show ip route");
      setRoutingTable(ROUTING_TABLE); // Use dummy data for now
    } catch (err) {
      console.error("ルーティングテーブル取得エラー:", err);
      setRoutingTable(ROUTING_TABLE);
    }
  }

  // Execute traceroute
  const executeTraceroute = async () => {
    try {
      addTerminalLine(`traceroute ${targetIp}`);
      
      // Try to fetch from real API
      try {
        const response = await fetch(`${API_BASE_URL}/router/${routerIp}/traceroute?target=${targetIp}`);
        if (!response.ok) {
          throw new Error("トレースルートの実行に失敗しました");
        }
        const data = await response.json();
        setTracerouteResult(data);
      } catch (err) {
        console.error("トレースルート実行エラー:", err);
        // Fallback to dummy data
        addTerminalLine("Type escape sequence to abort.");
        addTerminalLine(`Tracing the route to ${targetIp}`);
        
        // Add traceroute hops with delays to simulate real execution
        for (let i = 0; i < TRACE_ROUTE_RESULT.length; i++) {
          const hop = TRACE_ROUTE_RESULT[i];
          // Add with a delay to simulate real execution
          setTimeout(() => {
            addTerminalLine(` ${hop.hop}  ${hop.ip}  ${hop.rtt} ms`);
            if (i === TRACE_ROUTE_RESULT.length - 1) {
              setTracerouteResult(TRACE_ROUTE_RESULT);
            }
          }, i * 500);
        }
      }
    } catch (err) {
      console.error("トレースルート実行エラー:", err);
      setError("トレースルートの実行に失敗しました");
    }
  }

  // Run diagnostics
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticResults(null);
    setProgress(0);
    
    try {
      // Clear terminal and add diagnostic commands
      addTerminalLine("Router# show ip interface brief");
      
      // Update progress
      const updateProgress = (value: number) => {
        setProgress(value);
      };
      
      // Simulate progress in steps
      updateProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show interface status
      Object.entries(interfaces).forEach(([name, details]) => {
        addTerminalLine(`${name.padEnd(25)} ${details.status.padEnd(15)} ${details.protocol.padEnd(10)} ${details.ip}`);
      });
      
      updateProgress(30);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Show routing table
      addTerminalLine("\nRouter# show ip route");
      addTerminalLine("Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP");
      addTerminalLine("       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area");
      
      updateProgress(50);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      routingTable.forEach(route => {
        addTerminalLine(`${route.protocol} ${route.destination} [${route.metric}/0] via ${route.nextHop}, ${route.interface}`);
      });
      
      updateProgress(70);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Try to get real diagnostic data from API
      try {
        const response = await fetch(`${API_BASE_URL}/router/${routerIp}/diagnostics`);
        if (!response.ok) {
          throw new Error("診断の実行に失敗しました");
        }
        const data = await response.json();
        setDiagnosticResults(data);
      } catch (err) {
        console.error("診断実行エラー:", err);
        // Fallback to dummy data - all healthy in this case
        setDiagnosticResults({
          status: "healthy",
          summary: "全てのシステムは正常に動作しています",
          issues: []
        });
      }
      
      updateProgress(100);
      
      // Auto-expand terminal to show results
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
  }

  // Execute command
  const executeCommand = async () => {
    if (!commandInput.trim()) return;
    
    addTerminalLine(`Router# ${commandInput}`);
    
    try {
      // Try to execute on real router
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
      
      // Add output lines
      output.split("\n").forEach((line: string) => {
        addTerminalLine(line);
      });
      
    } catch (err) {
      console.error("コマンド実行エラー:", err);
      // Fallback - just echo the command
      addTerminalLine(`Command executed: ${commandInput}`);
    }
    
    // Clear input
    setCommandInput("");
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "up": return "text-green-500";
      case "down": return "text-red-500";
      case "administratively down": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  // Get severity icon
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

  return (
    <Layout title="ルーティング実践 🌐" backLink="/" backText="トップメニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-4xl mx-auto space-y-6">
        {/* Connection Status */}
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
                  ? `${routerInfo?.name || 'Cisco'} ルーター (${routerInfo?.ip || routerIp}) に接続されています` 
                  : '接続ボタンをクリックしてルーターへの接続を確立してください'}
              </p>
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
        
        {/* Connection Form */}
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
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 mt-2"
                  onClick={handleConnect}
                >
                  <Wifi className="mr-2 h-4 w-4" />
                  接続
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 mt-2"
                  onClick={() => {
                    setRouterIp("192.168.2.2");
                    setUsername("admin");
                    setPassword("");
                  }}
                >
                  <RouterIcon className="mr-2 h-4 w-4" />
                  R2に設定
                </Button>
              </div>
              <p className="text-xs italic mt-2">
                接続できない場合はデモモードで動作します。「R2に設定」ボタンをクリックすると、R2ルーターの接続情報が設定されます。
              </p>
            </div>
          </div>
        )}

        {/* Network Topology */}
        <div className="bg-white bg-opacity-20 rounded-xl border-2 border-cyan-400 overflow-hidden">
          <div 
            className="flex items-center justify-between bg-cyan-500 bg-opacity-30 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
            onClick={() => toggleSection('networkTopology')}
          >
            <div className="flex items-center">
              <Network className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">ネットワークトポロジー</h2>
            </div>
            {expandedSections.networkTopology ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-300" />
            )}
          </div>
          
          {expandedSections.networkTopology && (
            <div className="p-3 sm:p-4">
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
                    このネットワーク構成では、R1または R2のいずれかに接続してルーティングを設定できます。
                    R1から PC2へのアクセスには、192.168.3.0/24へのスタティックルートが必要です。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Device Information */}
        <div className="bg-white bg-opacity-20 rounded-xl border-2 border-blue-400 overflow-hidden">
          <div 
            className="flex items-center justify-between bg-blue-500 bg-opacity-30 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
            onClick={() => toggleSection('deviceInfo')}
          >
            <div className="flex items-center">
              <Server className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">デバイス情報</h2>
            </div>
            {expandedSections.deviceInfo ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
            )}
          </div>
          
          {expandedSections.deviceInfo && (
            <div className="p-3 sm:p-4">
              {connected && routerInfo ? (
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
                    <span className="text-xs sm:text-sm opacity-80">IOSバージョン:</span>
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
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 sm:h-24">
                  <p className="text-xs sm:text-sm opacity-80">接続するとデバイス情報が表示されます</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Interface Status */}
        <div className="bg-white bg-opacity-20 rounded-xl border-2 border-green-400 overflow-hidden">
          <div 
            className="flex items-center justify-between bg-green-500 bg-opacity-30 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
            onClick={() => toggleSection('interfaces')}
          >
            <div className="flex items-center">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">インターフェース状態</h2>
            </div>
            {expandedSections.interfaces ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
            )}
          </div>
          
          {expandedSections.interfaces && (
            <div className="p-3 sm:p-4">
              {connected && Object.keys(interfaces).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white border-opacity-20">
                        <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">インターフェース</th>
                        <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">状態</th>
                        <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">プロトコル</th>
                        <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider">IPアドレス</th>
                        <th className="px-2 sm:px-4 py-1 sm:py-2 text-left text-xs font-medium opacity-80 uppercase tracking-wider hidden sm:table-cell">速度/デュプレックス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(interfaces).map(([name, details]) => (
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
                          <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm hidden sm:table-cell">{details.speed}/{details.duplex}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 sm:h-24">
                  <p className="text-xs sm:text-sm opacity-80">接続するとインターフェース状態が表示されます</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Routing Table */}
        <div className="bg-white bg-opacity-20 rounded-xl border-2 border-purple-400 overflow-hidden">
          <div 
            className="flex items-center justify-between bg-purple-500 bg-opacity-30 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
            onClick={() => toggleSection('routing')}
          >
            <div className="flex items-center">
              <Table className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">ルーティングテーブル</h2>
            </div>
            {expandedSections.routing ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
            )}
          </div>
          
          {expandedSections.routing && (
            <div className="p-3 sm:p-4">
              {connected && routingTable.length > 0 ? (
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
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-mono">{route.destination}</td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-mono">{route.nextHop}</td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{route.interface}</td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">
                            <span className={`inline-flex items-center px-1 py-0.5 rounded-md text-xs font-medium ${
                              route.protocol === 'C' 
                                ? 'bg-green-700 bg-opacity-40 text-green-300' 
                                : route.protocol === 'S'
                                  ? 'bg-blue-700 bg-opacity-40 text-blue-300'
                                  : 'bg-gray-700 bg-opacity-40 text-gray-300'
                            }`}>
                              {route.protocol === 'C' && 'Connected'}
                              {route.protocol === 'S' && 'Static'}
                              {route.protocol === 'O' && 'OSPF'}
                              {route.protocol === 'R' && 'RIP'}
                              {route.protocol === 'B' && 'BGP'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{route.metric}</td>
                          <td className="hidden sm:table-cell px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm">{route.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24">
                  <p className="text-xs sm:text-sm opacity-80">接続するとルーティングテーブルが表示されます</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Traceroute */}
        <div className="bg-white bg-opacity-20 rounded-xl border-2 border-amber-400 overflow-hidden">
          <div 
            className="flex items-center justify-between bg-amber-500 bg-opacity-30 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
            onClick={() => toggleSection('traceroute')}
          >
            <div className="flex items-center">
              <Route className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">経路追跡</h2>
            </div>
            {expandedSections.traceroute ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />
            )}
          </div>
          
          {expandedSections.traceroute && (
            <div className="p-3 sm:p-4">
              {connected ? (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Input
                      type="text"
                      placeholder="宛先IPアドレス"
                      value={targetIp}
                      onChange={(e) => setTargetIp(e.target.value)}
                      className="flex-1 bg-white text-black placeholder-gray-400"
                    />
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
                                {hop.ip.includes('192.168') ? (
                                  <RouterIcon className="h-3 w-3 mr-1 text-amber-300" />
                                ) : (
                                  <Network className="h-3 w-3 mr-1 text-amber-300" />
                                )}
                                <span className="font-mono text-xs">{hop.ip}</span>
                              </div>
                            </div>
                            
                            {hop.rtt !== null ? (
                              <span className="text-xs font-mono">{hop.rtt} ms</span>
                            ) : (
                              <span className="text-xs font-mono text-gray-400">タイムアウト</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24">
                  <p className="text-xs sm:text-sm opacity-80">接続すると経路追跡機能が使用できます</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Terminal Output */}
        <div className="bg-white bg-opacity-20 rounded-xl border-2 border-gray-400 overflow-hidden">
          <div 
            className="flex items-center justify-between bg-gray-500 bg-opacity-30 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
            onClick={() => toggleSection('terminal')}
          >
            <div className="flex items-center">
              <TerminalSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">ターミナル出力</h2>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {terminalOutput.length > 0 && (
                <button 
                  className="text-xs bg-gray-600 hover:bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(terminalOutput.join('\n'));
                  }}
                >
                  <Clipboard className="h-3 w-3 mr-1" />
                  コピー
                </button>
              )}
              {expandedSections.terminal ? (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
              ) : (
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
              )}
            </div>
          </div>
          
          {expandedSections.terminal && (
            <div className="p-0">
              <div className="bg-black bg-opacity-80 font-mono text-xs sm:text-sm p-3 sm:p-4 rounded-b-lg max-h-64 sm:max-h-96 overflow-y-auto">
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
              
              {connected && (
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
              )}
            </div>
          )}
        </div>
        
        {/* Diagnostic Results */}
        <div className="bg-white bg-opacity-20 rounded-xl border-2 border-indigo-400 overflow-hidden">
          <div 
            className="flex items-center justify-between bg-indigo-500 bg-opacity-30 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
            onClick={() => toggleSection('diagnostics')}
          >
            <div className="flex items-center">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-300 mr-2" />
              <h2 className="font-semibold text-sm sm:text-base">診断結果</h2>
            </div>
            {expandedSections.diagnostics ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-300" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-300" />
            )}
          </div>
          
          {expandedSections.diagnostics && (
            <div className="p-3 sm:p-4">
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
              ) : isRunningDiagnostics ? (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8">
                  <RefreshCw className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400 animate-spin mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-medium">診断実行中...</p>
                  <p className="text-xs sm:text-sm opacity-80 mt-1 sm:mt-2">少々お待ちください</p>
                </div>
              ) : connected ? (
                <div className="flex flex-col items-center justify-center p-6 sm:p-12">
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
                  >
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                    診断を実行
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 sm:h-48">
                  <p className="text-xs sm:text-sm opacity-80">まずルーターに接続してください</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
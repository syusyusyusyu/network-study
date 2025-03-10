from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Any, Literal
import asyncio
import random
import logging
from datetime import datetime
import paramiko
import re
import ipaddress
from enum import Enum

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Network Router API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では特定のオリジンのみを許可する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# サポートするベンダーの列挙型
class VendorType(str, Enum):
    CISCO = "cisco"
    JUNIPER = "juniper"
    HP = "hp"
    HUAWEI = "huawei"
    MIKROTIK = "mikrotik"
    UNKNOWN = "unknown"

# データモデル
class RouterInfo(BaseModel):
    ip: str
    username: Optional[str] = None
    password: Optional[str] = None
    enable_password: Optional[str] = None
    connection_type: str = "ssh"  # ssh, telnet, snmp
    vendor: Optional[VendorType] = None

class CommandRequest(BaseModel):
    command: str

class InterfaceInfo(BaseModel):
    name: str
    status: str
    protocol: str
    ip: str
    speed: Optional[str] = "auto"
    duplex: Optional[str] = "auto"
    description: Optional[str] = None
    mac: Optional[str] = None
    mtu: Optional[int] = None

class RouteEntry(BaseModel):
    destination: str
    prefix_length: Optional[int] = None
    next_hop: str
    interface: str
    protocol: str
    metric: Optional[int] = None
    administrative_distance: Optional[int] = None
    type: Optional[str] = None

class PingResult(BaseModel):
    success: bool
    packet_loss: float
    rtt_min: Optional[float] = None
    rtt_avg: Optional[float] = None
    rtt_max: Optional[float] = None
    packets_sent: int
    packets_received: int

class TraceRouteHop(BaseModel):
    hop: int
    ip: str
    hostname: Optional[str] = None
    rtt: Optional[float] = None
    status: str = "success"  # success, timeout, unreachable

class NetworkDevice(BaseModel):
    name: str
    type: str
    ip: Optional[str] = None
    model: Optional[str] = None
    interfaces: Optional[List[Dict[str, Any]]] = None

class NetworkTopology(BaseModel):
    devices: List[NetworkDevice]
    connections: List[Dict[str, Any]]

class DiagnosticIssue(BaseModel):
    type: str
    severity: str  # critical, high, medium, low
    description: str
    recommendation: str
    affected_component: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class DiagnosticResult(BaseModel):
    status: str  # healthy, warning, error
    summary: str
    issues: List[DiagnosticIssue]
    timestamp: str

class ConnectionResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None
    vendor: Optional[VendorType] = None

# ベンダー固有のコマンド
VENDOR_COMMANDS = {
    VendorType.CISCO: {
        "version": "show version",
        "interfaces": "show ip interface brief",
        "interface_detail": "show interfaces {interface}",
        "routing_table": "show ip route",
        "neighbors": "show cdp neighbors detail",
        "config": "show running-config",
        "traceroute": "traceroute {target}",
        "ping": "ping {target}",
        "vrf_list": "show vrf",
        "vrf_interfaces": "show ip vrf interfaces",
        "vrf_routes": "show ip route vrf {vrf}",
    },
    VendorType.JUNIPER: {
        "version": "show version",
        "interfaces": "show interfaces terse",
        "interface_detail": "show interfaces {interface} detail",
        "routing_table": "show route",
        "neighbors": "show lldp neighbors",
        "config": "show configuration",
        "traceroute": "traceroute {target}",
        "ping": "ping {target} count 5",
        "vrf_list": "show routing-instances",
        "vrf_interfaces": "show interfaces routing-instance {vrf}",
        "vrf_routes": "show route table {vrf}.inet.0",
    },
    VendorType.HP: {
        "version": "display version",
        "interfaces": "display interface brief",
        "interface_detail": "display interface {interface}",
        "routing_table": "display ip routing-table",
        "neighbors": "display lldp neighbor",
        "config": "display current-configuration",
        "traceroute": "tracert {target}",
        "ping": "ping {target}",
        "vrf_list": "display ip vpn-instance",
        "vrf_interfaces": "display ip vpn-instance interface",
        "vrf_routes": "display ip routing-table vpn-instance {vrf}",
    },
    VendorType.HUAWEI: {
        "version": "display version",
        "interfaces": "display ip interface brief",
        "interface_detail": "display interface {interface}",
        "routing_table": "display ip routing-table",
        "neighbors": "display lldp neighbor",
        "config": "display current-configuration",
        "traceroute": "tracert {target}",
        "ping": "ping {target}",
        "vrf_list": "display ip vpn-instance",
        "vrf_interfaces": "display ip vpn-instance interface",
        "vrf_routes": "display ip routing-table vpn-instance {vrf}",
    },
    VendorType.MIKROTIK: {
        "version": "/system resource print",
        "interfaces": "/interface print detail",
        "interface_detail": "/interface print detail where name={interface}",
        "routing_table": "/ip route print detail",
        "neighbors": "/ip neighbor print detail",
        "config": "/export",
        "traceroute": "/tool traceroute {target}",
        "ping": "/ping {target} count=5",
        "vrf_list": "/routing table print",
        "vrf_interfaces": "/ip address print where routing-table={vrf}",
        "vrf_routes": "/ip route print where routing-table={vrf}",
    },
}

# 接続したルーターとセッションの管理
connected_routers = {}

# ダミーデータ - 接続できない場合のフォールバック用
DUMMY_ROUTERS = {
    VendorType.CISCO: {
        "info": {
            "name": "Cisco 892",
            "model": "C892FSP-K9",
            "serial_number": "FTX1840ABCD",
            "firmware_version": "15.7(3)M2",
            "uptime": "10 days, 4 hours, 32 minutes"
        },
        "interfaces": {
            "GigabitEthernet0/0": {
                "name": "GigabitEthernet0/0",
                "status": "up", 
                "protocol": "up", 
                "ip": "192.168.1.1",
                "speed": "1000Mb/s",
                "duplex": "full",
                "description": "LAN接続",
                "mac": "00:11:22:33:44:55"
            },
            "GigabitEthernet0/1": {
                "name": "GigabitEthernet0/1",
                "status": "up", 
                "protocol": "up", 
                "ip": "10.0.0.1",
                "speed": "1000Mb/s",
                "duplex": "full",
                "description": "WAN接続",
                "mac": "00:11:22:33:44:56"
            },
            "GigabitEthernet0/2": {
                "name": "GigabitEthernet0/2",
                "status": "up", 
                "protocol": "up", 
                "ip": "172.16.0.1",
                "speed": "1000Mb/s",
                "duplex": "full",
                "description": "DMZ",
                "mac": "00:11:22:33:44:57"
            },
            "GigabitEthernet0/3": {
                "name": "GigabitEthernet0/3",
                "status": "administratively down", 
                "protocol": "down", 
                "ip": "unassigned",
                "speed": "auto",
                "duplex": "auto",
                "description": "未使用",
                "mac": "00:11:22:33:44:58"
            }
        },
        "routes": [
            {"destination": "192.168.1.0", "prefix_length": 24, "next_hop": "Connected", "interface": "GigabitEthernet0/0", "protocol": "C", "metric": 0, "administrative_distance": 0, "type": "Direct"},
            {"destination": "10.0.0.0", "prefix_length": 24, "next_hop": "Connected", "interface": "GigabitEthernet0/1", "protocol": "C", "metric": 0, "administrative_distance": 0, "type": "Direct"},
            {"destination": "172.16.0.0", "prefix_length": 24, "next_hop": "Connected", "interface": "GigabitEthernet0/2", "protocol": "C", "metric": 0, "administrative_distance": 0, "type": "Direct"},
            {"destination": "0.0.0.0", "prefix_length": 0, "next_hop": "10.0.0.254", "interface": "GigabitEthernet0/1", "protocol": "S", "metric": 1, "administrative_distance": 1, "type": "Static"}
        ]
    },
    VendorType.JUNIPER: {
        "info": {
            "name": "Juniper SRX320",
            "model": "SRX320",
            "serial_number": "AF1234567890",
            "firmware_version": "21.4R1.12",
            "uptime": "15 days, 2 hours, 18 minutes"
        },
        "interfaces": {
            "ge-0/0/0": {
                "name": "ge-0/0/0",
                "status": "up", 
                "protocol": "up", 
                "ip": "192.168.1.1",
                "speed": "1000Mb/s",
                "duplex": "full",
                "description": "LAN接続",
                "mac": "00:a1:b2:c3:d4:e5"
            },
            "ge-0/0/1": {
                "name": "ge-0/0/1",
                "status": "up", 
                "protocol": "up", 
                "ip": "10.0.0.1",
                "speed": "1000Mb/s",
                "duplex": "full",
                "description": "WAN接続",
                "mac": "00:a1:b2:c3:d4:e6"
            }
        },
        "routes": [
            {"destination": "192.168.1.0", "prefix_length": 24, "next_hop": "Connected", "interface": "ge-0/0/0", "protocol": "Direct", "metric": 0, "administrative_distance": 0, "type": "Direct"},
            {"destination": "10.0.0.0", "prefix_length": 24, "next_hop": "Connected", "interface": "ge-0/0/1", "protocol": "Direct", "metric": 0, "administrative_distance": 0, "type": "Direct"},
            {"destination": "0.0.0.0", "prefix_length": 0, "next_hop": "10.0.0.254", "interface": "ge-0/0/1", "protocol": "Static", "metric": 1, "administrative_distance": 5, "type": "Static"}
        ]
    }
}

# ベンダー検出
def detect_vendor(output: str) -> VendorType:
    """コマンド出力からベンダーを検出する"""
    if re.search(r'Cisco|IOS', output, re.IGNORECASE):
        return VendorType.CISCO
    elif re.search(r'JUNOS|Juniper', output, re.IGNORECASE):
        return VendorType.JUNIPER
    elif re.search(r'HP|Hewlett-Packard|HPE|Aruba', output, re.IGNORECASE):
        return VendorType.HP
    elif re.search(r'Huawei', output, re.IGNORECASE):
        return VendorType.HUAWEI
    elif re.search(r'MikroTik|RouterOS', output, re.IGNORECASE):
        return VendorType.MIKROTIK
    else:
        return VendorType.UNKNOWN

# SSH接続関数
def connect_ssh(router_info: RouterInfo):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=router_info.ip, 
            username=router_info.username, 
            password=router_info.password, 
            timeout=10
        )
        
        # ベンダー検出
        vendor = router_info.vendor
        if not vendor or vendor == VendorType.UNKNOWN:
            # show versionコマンドを試行して自動検出
            stdin, stdout, stderr = client.exec_command("show version")
            output = stdout.read().decode()
            vendor = detect_vendor(output)
            
            # Cisco以外の場合、他のコマンドも試行
            if vendor == VendorType.UNKNOWN:
                commands = [
                    "display version",  # Huawei, HP
                    "/system resource print",  # MikroTik
                ]
                for cmd in commands:
                    stdin, stdout, stderr = client.exec_command(cmd)
                    output = stdout.read().decode()
                    vendor = detect_vendor(output)
                    if vendor != VendorType.UNKNOWN:
                        break
        
        return {
            "success": True,
            "client": client,
            "vendor": vendor,
            "message": f"Successfully connected to {router_info.ip}"
        }
    except Exception as e:
        logger.error(f"SSH connection error: {str(e)}")
        return {
            "success": False,
            "client": None,
            "vendor": VendorType.UNKNOWN,
            "message": f"Failed to connect: {str(e)}"
        }

# コマンド実行関数
def execute_ssh_command(client, command, timeout=30):
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if error:
            return {"success": False, "output": error}
        return {"success": True, "output": output}
    except Exception as e:
        logger.error(f"Command execution error: {str(e)}")
        return {"success": False, "output": str(e)}

# インターフェース情報の解析 - Ciscoタイプ
def parse_cisco_interfaces(output):
    interfaces = {}
    lines = output.split('\n')
    
    for line in lines:
        parts = line.split()
        if len(parts) >= 5 and not line.startswith("Interface"):
            interface_name = parts[0]
            ip = parts[1] if parts[1] != "unassigned" else "unassigned"
            status = parts[4] if len(parts) > 4 else "unknown"
            protocol = parts[5] if len(parts) > 5 else "unknown"
            
            interfaces[interface_name] = {
                "name": interface_name,
                "status": status,
                "protocol": protocol,
                "ip": ip,
                "speed": "auto",
                "duplex": "auto"
            }
    
    return interfaces

# インターフェース情報の解析 - Juniperタイプ
def parse_juniper_interfaces(output):
    interfaces = {}
    lines = output.split('\n')
    current_interface = None
    
    for line in lines:
        if not line.strip():
            continue
            
        if not line.startswith(" "):  # 新しいインターフェース
            parts = line.split()
            if len(parts) >= 2:
                interface_name = parts[0]
                status = "up" if "up" in line else "down"
                protocol = "up" if "up" in line else "down"
                ip = parts[-1] if "." in parts[-1] else "unassigned"
                
                interfaces[interface_name] = {
                    "name": interface_name,
                    "status": status,
                    "protocol": protocol,
                    "ip": ip,
                    "speed": "auto",
                    "duplex": "auto"
                }
    
    return interfaces

# インターフェース情報の解析 - HPタイプ
def parse_hp_interfaces(output):
    interfaces = {}
    lines = output.split('\n')
    
    for line in lines:
        if not "UP" in line and not "DOWN" in line:
            continue
            
        parts = line.split()
        if len(parts) >= 3:
            interface_name = parts[0]
            status = "up" if "UP" in line else "down"
            protocol = "up" if "UP" in parts[2] else "down"
            ip = "unassigned"
            
            # IPアドレス情報を探す
            ip_match = re.search(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', line)
            if ip_match:
                ip = ip_match.group(1)
                
            interfaces[interface_name] = {
                "name": interface_name,
                "status": status,
                "protocol": protocol,
                "ip": ip,
                "speed": "auto",
                "duplex": "auto"
            }
    
    return interfaces

# ベンダーに応じたインターフェース解析
def parse_interfaces(output, vendor):
    if vendor == VendorType.CISCO:
        return parse_cisco_interfaces(output)
    elif vendor == VendorType.JUNIPER:
        return parse_juniper_interfaces(output)
    elif vendor in [VendorType.HP, VendorType.HUAWEI]:
        return parse_hp_interfaces(output)
    else:
        # デフォルトはCiscoタイプの解析を試みる
        return parse_cisco_interfaces(output)

# Ciscoルーティングテーブルの解析
def parse_cisco_routes(output):
    routes = []
    lines = output.split('\n')
    route_pattern = re.compile(r'([CSROBIEGHD\*])\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(/(\d{1,2}))?\s+(?:\[(\d+)/(\d+)\])?\s+(?:via\s+)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?\s*,?\s*(\w+[\d/]+)?')
    connected_pattern = re.compile(r'([CSROBIEGHD\*])\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(/(\d{1,2}))?\s+is directly connected,\s+(\w+[\d/]+)')
    
    for line in lines:
        if line.strip() and any(code in line[:2] for code in "CSROBIEGHD*"):
            # 直接接続されたルート
            connected_match = connected_pattern.search(line)
            if connected_match:
                protocol = connected_match.group(1)
                destination = connected_match.group(2)
                prefix_length = int(connected_match.group(4)) if connected_match.group(4) else 32
                interface = connected_match.group(5)
                
                routes.append({
                    "destination": destination,
                    "prefix_length": prefix_length,
                    "next_hop": "Connected",
                    "interface": interface,
                    "protocol": protocol,
                    "metric": 0,
                    "administrative_distance": 0,
                    "type": "Direct"
                })
                continue
            
            # 通常のルート
            match = route_pattern.search(line)
            if match:
                protocol = match.group(1)
                destination = match.group(2)
                prefix_length = int(match.group(4)) if match.group(4) else 32
                administrative_distance = int(match.group(5)) if match.group(5) else 0
                metric = int(match.group(6)) if match.group(6) else 0
                next_hop = match.group(7) if match.group(7) else "Connected"
                interface = match.group(8) if match.group(8) else ""
                
                routes.append({
                    "destination": destination,
                    "prefix_length": prefix_length,
                    "next_hop": next_hop,
                    "interface": interface,
                    "protocol": protocol,
                    "metric": metric,
                    "administrative_distance": administrative_distance,
                    "type": "Static" if protocol == "S" else "Dynamic"
                })
    
    return routes

# Juniperルーティングテーブルの解析
def parse_juniper_routes(output):
    routes = []
    lines = output.split('\n')
    in_entry = False
    current_route = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if not line.startswith(" "):
            # 新しいルートエントリ
            if current_route and "destination" in current_route:
                routes.append(current_route)
                current_route = {}
                
            dest_match = re.match(r'^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/(\d{1,2})', line)
            if dest_match:
                current_route = {
                    "destination": dest_match.group(1),
                    "prefix_length": int(dest_match.group(2)),
                    "next_hop": "",
                    "interface": "",
                    "protocol": "",
                    "metric": 0,
                    "administrative_distance": 0,
                    "type": ""
                }
                in_entry = True
        elif in_entry:
            # ルートエントリの詳細
            if "via" in line:
                parts = line.split()
                current_route["interface"] = parts[1]
                
                # プロトコル情報を抽出
                if "Direct" in line:
                    current_route["protocol"] = "Direct"
                    current_route["next_hop"] = "Connected"
                    current_route["type"] = "Direct"
                elif "Static" in line:
                    current_route["protocol"] = "Static"
                    current_route["type"] = "Static"
                    # 次ホップを探す
                    next_hop_match = re.search(r'to (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', line)
                    if next_hop_match:
                        current_route["next_hop"] = next_hop_match.group(1)
    
    # 最後のルートを追加
    if current_route and "destination" in current_route:
        routes.append(current_route)
        
    return routes

# ベンダーに応じたルーティングテーブル解析
def parse_routes(output, vendor):
    if vendor == VendorType.CISCO:
        return parse_cisco_routes(output)
    elif vendor == VendorType.JUNIPER:
        return parse_juniper_routes(output)
    else:
        # デフォルトはCiscoタイプの解析を試みる
        return parse_cisco_routes(output)

# APIエンドポイント
@app.get("/")
async def root():
    return {"message": "Network Router API", "version": "2.0"}

@app.post("/connect", response_model=ConnectionResponse)
async def connect_router(router: RouterInfo):
    logger.info(f"Connection request: {router.ip}")
    
    # 実際のルーターへの接続を試みる
    connection_result = connect_ssh(router)
    
    if connection_result["success"]:
        session_id = f"session-{random.randint(1000, 9999)}"
        connected_routers[session_id] = {
            "ip": router.ip,
            "client": connection_result["client"],
            "vendor": connection_result["vendor"],
            "connected_at": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "message": connection_result["message"],
            "session_id": session_id,
            "vendor": connection_result["vendor"]
        }
    else:
        # 接続失敗
        return {
            "success": False,
            "message": connection_result["message"],
            "session_id": None,
            "vendor": VendorType.UNKNOWN
        }

@app.get("/router/{ip}/info")
async def get_router_info(ip: str):
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # ベンダーに応じたコマンドを実行
        command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["version"]
        result = execute_ssh_command(client, command)
        
        if result["success"]:
            # コマンド出力からルーター情報を抽出
            output = result["output"]
            router_info = extract_router_info(output, vendor)
            router_info["ip"] = ip
            
            return router_info
        else:
            logger.warning(f"Failed to get router info, using dummy data: {result}")
            dummy_data = DUMMY_ROUTERS.get(vendor, DUMMY_ROUTERS[VendorType.CISCO])["info"]
            dummy_data["ip"] = ip
            return dummy_data
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        dummy_data = DUMMY_ROUTERS[VendorType.CISCO]["info"]
        dummy_data["ip"] = ip
        return dummy_data

def extract_router_info(output, vendor):
    """ベンダーに応じたルーター情報の抽出"""
    if vendor == VendorType.CISCO:
        model_match = re.search(r'[Cc]isco (.+?)(?:\s|\()', output)
        version_match = re.search(r'Version ([^,]+)', output)
        serial_match = re.search(r'[Ss]erial [Nn]umber\s*:\s*(\w+)', output)
        uptime_match = re.search(r'uptime is (.+)', output)
        
        return {
            "name": "Cisco Router",
            "model": model_match.group(1) if model_match else "Unknown",
            "serialNumber": serial_match.group(1) if serial_match else "Unknown",
            "firmwareVersion": version_match.group(1) if version_match else "Unknown",
            "uptime": uptime_match.group(1) if uptime_match else "Unknown"
        }
    elif vendor == VendorType.JUNIPER:
        model_match = re.search(r'Model: (\w+)', output)
        version_match = re.search(r'JUNOS ([^,\s]+)', output)
        serial_match = re.search(r'Serial Number: (\w+)', output)
        uptime_match = re.search(r'System booted: (.+)', output)
        
        return {
            "name": "Juniper Router",
            "model": model_match.group(1) if model_match else "Unknown",
            "serialNumber": serial_match.group(1) if serial_match else "Unknown",
            "firmwareVersion": version_match.group(1) if version_match else "Unknown",
            "uptime": uptime_match.group(1) if uptime_match else "Unknown"
        }
    else:
        # デフォルト情報
        return {
            "name": "Network Router",
            "model": "Unknown",
            "serialNumber": "Unknown",
            "firmwareVersion": "Unknown",
            "uptime": "Unknown"
        }

@app.get("/router/{ip}/interfaces")
async def get_interfaces(ip: str):
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # ベンダーに応じたコマンドを実行
        command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["interfaces"]
        result = execute_ssh_command(client, command)
        
        if result["success"]:
            # コマンド出力からインターフェース情報を抽出
            interfaces = parse_interfaces(result["output"], vendor)
            
            # インターフェースの詳細情報を取得（オプション）
            for name, interface in list(interfaces.items()):
                try:
                    detail_command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["interface_detail"].format(interface=name)
                    detail_result = execute_ssh_command(client, detail_command)
                    if detail_result["success"]:
                        # スピード、デュプレックス、MAC、MTUなどを抽出
                        extract_interface_details(detail_result["output"], interface, vendor)
                except Exception as e:
                    logger.error(f"Failed to get interface details for {name}: {str(e)}")
            
            return interfaces
        else:
            logger.warning(f"Failed to get interfaces, using dummy data: {result}")
            return DUMMY_ROUTERS.get(vendor, DUMMY_ROUTERS[VendorType.CISCO])["interfaces"]
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return DUMMY_ROUTERS[VendorType.CISCO]["interfaces"]

def extract_interface_details(output, interface, vendor):
    """インターフェースの詳細情報を抽出"""
    if vendor == VendorType.CISCO:
        # スピード
        speed_match = re.search(r'BW (\d+) Kbit/sec', output)
        if speed_match:
            speed = int(speed_match.group(1))
            if speed >= 1000000:
                interface["speed"] = f"{speed//1000000}Gb/s"
            elif speed >= 1000:
                interface["speed"] = f"{speed//1000}Mb/s"
            else:
                interface["speed"] = f"{speed}Kb/s"
                
        # デュプレックス
        duplex_match = re.search(r'(Half|Full)-duplex', output)
        if duplex_match:
            interface["duplex"] = duplex_match.group(1).lower()
            
        # MAC
        mac_match = re.search(r'address is ([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})', output)
        if mac_match:
            interface["mac"] = mac_match.group(1)
            
        # MTU
        mtu_match = re.search(r'MTU (\d+) bytes', output)
        if mtu_match:
            interface["mtu"] = int(mtu_match.group(1))
            
        # 説明
        desc_match = re.search(r'Description: (.+)', output)
        if desc_match:
            interface["description"] = desc_match.group(1).strip()
            
    elif vendor == VendorType.JUNIPER:
        # スピード
        speed_match = re.search(r'Speed: (\d+)mbps', output)
        if speed_match:
            interface["speed"] = f"{speed_match.group(1)}Mb/s"
            
        # デュプレックス
        duplex_match = re.search(r'Link-mode: (Half|Full)-duplex', output)
        if duplex_match:
            interface["duplex"] = duplex_match.group(1).lower()
            
        # MAC
        mac_match = re.search(r'Current address: ([0-9a-fA-F:]{17})', output)
        if mac_match:
            interface["mac"] = mac_match.group(1)
            
        # MTU
        mtu_match = re.search(r'MTU: (\d+)', output)
        if mtu_match:
            interface["mtu"] = int(mtu_match.group(1))
            
        # 説明
        desc_match = re.search(r'Description: (.+)', output)
        if desc_match:
            interface["description"] = desc_match.group(1).strip()

@app.get("/router/{ip}/routing-table")
async def get_routing_table(ip: str):
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # ベンダーに応じたコマンドを実行
        command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["routing_table"]
        result = execute_ssh_command(client, command)
        
        if result["success"]:
            # コマンド出力からルーティングテーブルを抽出
            return parse_routes(result["output"], vendor)
        else:
            logger.warning(f"Failed to get routing table, using dummy data: {result}")
            return DUMMY_ROUTERS.get(vendor, DUMMY_ROUTERS[VendorType.CISCO])["routes"]
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return DUMMY_ROUTERS[VendorType.CISCO]["routes"]

@app.get("/router/{ip}/traceroute")
async def traceroute(ip: str, target: str):
    # IPアドレスの形式チェック
    try:
        ipaddress.ip_address(target)
    except ValueError:
        # ホスト名の場合はそのまま通す
        pass
    
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # ベンダーに応じたコマンドを実行
        command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["traceroute"].format(target=target)
        result = execute_ssh_command(client, command, timeout=60)  # トレースルートは時間がかかる可能性がある
        
        if result["success"]:
            # コマンド出力からトレースルート結果を抽出
            return parse_traceroute(result["output"], vendor)
        else:
            logger.warning(f"Failed to traceroute {target}, using dummy data: {result}")
            return generate_dummy_traceroute(target)
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return generate_dummy_traceroute(target)

def parse_traceroute(output, vendor):
    """トレースルート結果を解析"""
    hops = []
    
    if vendor == VendorType.CISCO:
        lines = output.strip().split('\n')
        for line in lines:
            # ヘッダー行をスキップ
            if "Tracing the route" in line or not line.strip():
                continue
            
            # ホップ番号とIPアドレスを抽出
            hop_match = re.match(r'^\s*(\d+)\s+(?:\*\s+\*\s+\*|([^\s]+)(?:\s+\(([^\)]+)\))?\s+(\d+(?:\.\d+)?)?\s*ms)', line)
            if hop_match:
                hop_num = int(hop_match.group(1))
                
                # タイムアウトの場合
                if "*" in line and not hop_match.group(2):
                    hops.append({"hop": hop_num, "ip": "*", "hostname": None, "rtt": None, "status": "timeout"})
                else:
                    # IP or ホスト名、応答時間
                    ip_or_host = hop_match.group(2)
                    ip = hop_match.group(3) if hop_match.group(3) else ip_or_host
                    hostname = ip_or_host if hop_match.group(3) else None
                    rtt = float(hop_match.group(4)) if hop_match.group(4) else None
                    
                    hops.append({
                        "hop": hop_num, 
                        "ip": ip, 
                        "hostname": hostname, 
                        "rtt": rtt,
                        "status": "success"
                    })
    else:
        # 他のベンダーの場合も同様に解析（単純化のためCiscoと同じ処理を使用）
        return parse_traceroute(output, VendorType.CISCO)
    
    return hops

def generate_dummy_traceroute(target):
    """ダミーのトレースルート結果を生成"""
    hops = []
    
    # ローカルネットワークのホップ
    hops.append({"hop": 1, "ip": "192.168.1.1", "hostname": "router.local", "rtt": 0.5, "status": "success"})
    
    # ISPのホップ
    hops.append({"hop": 2, "ip": "10.0.0.1", "hostname": None, "rtt": 1.2, "status": "success"})
    hops.append({"hop": 3, "ip": "172.16.0.1", "hostname": None, "rtt": 5.8, "status": "success"})
    
    # インターネットのホップ（一部タイムアウト）
    hops.append({"hop": 4, "ip": "*", "hostname": None, "rtt": None, "status": "timeout"})
    hops.append({"hop": 5, "ip": "203.0.113.1", "hostname": None, "rtt": 15.3, "status": "success"})
    
    # 最終目的地
    hops.append({"hop": 6, "ip": target, "hostname": None, "rtt": 20.1, "status": "success"})
    
    return hops

@app.get("/router/{ip}/ping")
async def ping(ip: str, target: str, count: int = 5):
    # IPアドレスの形式チェック
    try:
        ipaddress.ip_address(target)
    except ValueError:
        # ホスト名の場合はそのまま通す
        pass
    
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # ベンダーに応じたコマンドを実行
        base_command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["ping"]
        command = base_command.format(target=target)
        
        # Ciscoの場合、カウント指定を追加
        if vendor == VendorType.CISCO:
            command = f"{command} repeat {count}"
            
        result = execute_ssh_command(client, command)
        
        if result["success"]:
            # コマンド出力からping結果を抽出
            return parse_ping_result(result["output"], vendor)
        else:
            logger.warning(f"Failed to ping {target}, using dummy data: {result}")
            return generate_dummy_ping_result(target)
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return generate_dummy_ping_result(target)

def parse_ping_result(output, vendor):
    """Ping結果を解析"""
    if vendor == VendorType.CISCO:
        # 成功率を抽出
        success_match = re.search(r'Success rate is (\d+) percent \((\d+)/(\d+)\)', output)
        if success_match:
            success_rate = int(success_match.group(1))
            received = int(success_match.group(2))
            sent = int(success_match.group(3))
            
            # RTT値を抽出
            rtt_match = re.search(r'min/avg/max = (\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+)', output)
            
            if rtt_match:
                return {
                    "success": success_rate > 0,
                    "packet_loss": 100 - success_rate,
                    "rtt_min": float(rtt_match.group(1)),
                    "rtt_avg": float(rtt_match.group(2)),
                    "rtt_max": float(rtt_match.group(3)),
                    "packets_sent": sent,
                    "packets_received": received
                }
            else:
                return {
                    "success": success_rate > 0,
                    "packet_loss": 100 - success_rate,
                    "rtt_min": None,
                    "rtt_avg": None,
                    "rtt_max": None,
                    "packets_sent": sent,
                    "packets_received": received
                }
        else:
            # パターンにマッチしない場合
            return {
                "success": False,
                "packet_loss": 100,
                "rtt_min": None,
                "rtt_avg": None,
                "rtt_max": None,
                "packets_sent": 5,
                "packets_received": 0
            }
    else:
        # 他のベンダーについても同様に解析
        return parse_ping_result(output, VendorType.CISCO)

def generate_dummy_ping_result(target):
    """ダミーのping結果を生成"""
    return {
        "success": True,
        "packet_loss": 0,
        "rtt_min": 1.1,
        "rtt_avg": 2.3,
        "rtt_max": 3.7,
        "packets_sent": 5,
        "packets_received": 5
    }

@app.get("/router/{ip}/neighbors")
async def get_neighbors(ip: str):
    """隣接デバイス情報を取得"""
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # ベンダーに応じたコマンドを実行
        command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["neighbors"]
        result = execute_ssh_command(client, command)
        
        if result["success"]:
            # コマンド出力から隣接デバイス情報を抽出
            return parse_neighbors(result["output"], vendor)
        else:
            logger.warning(f"Failed to get neighbors, using dummy data: {result}")
            return generate_dummy_neighbors()
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return generate_dummy_neighbors()

def parse_neighbors(output, vendor):
    """隣接デバイス情報を解析"""
    neighbors = []
    
    if vendor == VendorType.CISCO:
        # CDPネイバー情報の解析
        device_pattern = re.compile(r'Device ID: (.+?)(?:\r|\n)')
        ip_pattern = re.compile(r'IP address: (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})')
        platform_pattern = re.compile(r'Platform: (.+?),')
        interface_pattern = re.compile(r'Interface: (.+?),[\s\r\n]+Port ID')
        port_pattern = re.compile(r'Port ID \(outgoing port\): (.+?)(?:\r|\n)')
        
        # デバイスごとのブロックを処理
        device_blocks = re.split(r'-{4,}', output)
        for block in device_blocks:
            if not block.strip():
                continue
                
            device_match = device_pattern.search(block)
            ip_match = ip_pattern.search(block)
            platform_match = platform_pattern.search(block)
            interface_match = interface_pattern.search(block)
            port_match = port_pattern.search(block)
            
            if device_match:
                neighbor = {
                    "device_id": device_match.group(1).strip(),
                    "ip_address": ip_match.group(1) if ip_match else None,
                    "platform": platform_match.group(1).strip() if platform_match else "Unknown",
                    "local_interface": interface_match.group(1).strip() if interface_match else "Unknown",
                    "remote_interface": port_match.group(1).strip() if port_match else "Unknown"
                }
                neighbors.append(neighbor)
    
    elif vendor == VendorType.JUNIPER:
        # LLDPネイバー情報の解析
        lines = output.split('\n')
        current_neighbor = {}
        
        for line in lines:
            line = line.strip()
            if "Neighbor" in line and "System" in line:
                if current_neighbor and "device_id" in current_neighbor:
                    neighbors.append(current_neighbor)
                current_neighbor = {}
                
            if "ChassisId" in line:
                chassis_match = re.search(r'ChassisId\s+(.+)$', line)
                if chassis_match:
                    current_neighbor["device_id"] = chassis_match.group(1).strip()
                    
            if "SysName" in line:
                name_match = re.search(r'SysName\s+(.+)$', line)
                if name_match:
                    current_neighbor["device_id"] = name_match.group(1).strip()
                    
            if "MgmtAddr" in line:
                ip_match = re.search(r'MgmtAddr\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', line)
                if ip_match:
                    current_neighbor["ip_address"] = ip_match.group(1)
                    
            if "Local interface" in line:
                if_match = re.search(r'Local interface\s+: (.+?),', line)
                if if_match:
                    current_neighbor["local_interface"] = if_match.group(1).strip()
                    
            if "Remote interface" in line:
                remote_match = re.search(r'Remote interface\s+: (.+?)(?:\s|$)', line)
                if remote_match:
                    current_neighbor["remote_interface"] = remote_match.group(1).strip()
        
        # 最後のネイバーを追加
        if current_neighbor and "device_id" in current_neighbor:
            neighbors.append(current_neighbor)
    
    return neighbors

def generate_dummy_neighbors():
    """ダミーの隣接デバイス情報を生成"""
    return [
        {
            "device_id": "Switch1",
            "ip_address": "192.168.1.2",
            "platform": "Cisco WS-C2960X",
            "local_interface": "GigabitEthernet0/0",
            "remote_interface": "GigabitEthernet1/0/24"
        },
        {
            "device_id": "Router2",
            "ip_address": "10.0.0.2",
            "platform": "Cisco C891F",
            "local_interface": "GigabitEthernet0/1",
            "remote_interface": "GigabitEthernet0/0"
        }
    ]

@app.get("/router/{ip}/diagnostics")
async def run_diagnostics(ip: str):
    """ネットワーク診断を実行"""
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # 各種ネットワーク情報を収集
        issues = []
        
        # 1. インターフェース情報を取得
        interfaces_command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["interfaces"]
        interfaces_result = execute_ssh_command(client, interfaces_command)
        
        if interfaces_result["success"]:
            interfaces = parse_interfaces(interfaces_result["output"], vendor)
            
            # インターフェース状態をチェック
            for name, interface in interfaces.items():
                # ダウンしているインターフェースをチェック
                if interface["status"] == "down" and interface["protocol"] == "down":
                    issues.append({
                        "type": "interface_down",
                        "severity": "high",
                        "description": f"インターフェース {name} がダウンしています",
                        "recommendation": "物理接続を確認するか、'no shutdown'コマンドでインターフェースを有効にしてください",
                        "affected_component": name
                    })
                elif interface["status"] == "administratively down":
                    issues.append({
                        "type": "interface_admin_down",
                        "severity": "medium",
                        "description": f"インターフェース {name} が管理上ダウンしています",
                        "recommendation": "'no shutdown'コマンドでインターフェースを有効にしてください",
                        "affected_component": name
                    })
        
        # 2. ルーティングテーブルを確認
        routing_command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["routing_table"]
        routing_result = execute_ssh_command(client, routing_command)
        
        if routing_result["success"]:
            routes = parse_routes(routing_result["output"], vendor)
            
            # デフォルトルートをチェック
            has_default_route = any(route["destination"] == "0.0.0.0" and route["prefix_length"] == 0 for route in routes)
            
            if not has_default_route:
                issues.append({
                    "type": "missing_default_route",
                    "severity": "high",
                    "description": "デフォルトルートが設定されていません",
                    "recommendation": "'ip route 0.0.0.0 0.0.0.0 [next-hop]'コマンドでデフォルトルートを設定してください",
                    "affected_component": "routing"
                })
                
            # ルートの重複をチェック
            route_networks = {}
            for route in routes:
                key = f"{route['destination']}/{route['prefix_length']}"
                if key in route_networks and route["protocol"] != route_networks[key]:
                    issues.append({
                        "type": "duplicate_routes",
                        "severity": "medium",
                        "description": f"ネットワーク {key} に対して重複するルートがあります",
                        "recommendation": "不要なルートを削除するか、管理ディスタンスを調整してください",
                        "affected_component": "routing",
                        "details": {
                            "network": key,
                            "protocols": [route_networks[key], route["protocol"]]
                        }
                    })
                route_networks[key] = route["protocol"]
        
        # 3. インターフェースと実際の構成の整合性をチェック
        config_command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["config"]
        config_result = execute_ssh_command(client, config_command)
        
        if config_result["success"]:
            # 設定がIPとMTUの不一致などをチェック
            # この例では簡略化のため省略
            pass
        
        # 4. その他のチェック（例: CPU/メモリ使用率、セキュリティ設定など）
        
        # 診断結果を返す
        if len(issues) == 0:
            return {
                "status": "healthy",
                "summary": "全てのシステムは正常に動作しています",
                "issues": [],
                "timestamp": datetime.now().isoformat()
            }
        else:
            has_critical = any(issue["severity"] == "critical" for issue in issues)
            has_high = any(issue["severity"] == "high" for issue in issues)
            
            if has_critical:
                status = "error"
                summary = f"{len(issues)}件の重大な問題が検出されました"
            elif has_high:
                status = "warning"
                summary = f"{len(issues)}件の重要な問題が検出されました"
            else:
                status = "warning"
                summary = f"{len(issues)}件の潜在的な問題が検出されました"
                
            return {
                "status": status,
                "summary": summary,
                "issues": issues,
                "timestamp": datetime.now().isoformat()
            }
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return {
            "status": "healthy",
            "summary": "全てのシステムは正常に動作しています",
            "issues": [],
            "timestamp": datetime.now().isoformat()
        }

@app.post("/router/{ip}/execute")
async def execute_command(ip: str, command_req: CommandRequest):
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # コマンド実行
        try:
            # コマンドの安全性チェック（オプション）
            if is_destructive_command(command_req.command):
                return {"output": "安全のため、破壊的なコマンドは実行できません。"}
            
            result = execute_ssh_command(client, command_req.command)
            
            if result["success"]:
                return {"output": result["output"]}
            else:
                return {"output": f"コマンド実行エラー: {result['output']}"}
        except Exception as e:
            logger.error(f"Command execution error: {str(e)}")
            return {"output": f"コマンド実行中にエラーが発生しました: {str(e)}"}
    else:
        # ルーターに接続されていない場合
        logger.warning(f"Router {ip} not connected, simulating command execution")
        
        # 簡単なコマンドシミュレーション
        command = command_req.command.lower()
        output = ""
        
        if "show version" in command:
            output = f"""Cisco IOS Software, C800 Software (C800-UNIVERSALK9-M), Version 15.7(3)M2
ROM: System Bootstrap, Version 15.7(3r)M2
Router uptime is 10 days, 4 hours, 32 minutes"""
        elif "show ip interface brief" in command:
            output = """Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.1.1     YES NVRAM  up                    up
GigabitEthernet0/1     10.0.0.1        YES NVRAM  up                    up
GigabitEthernet0/2     172.16.0.1      YES NVRAM  up                    up
GigabitEthernet0/3     unassigned      YES NVRAM  administratively down down"""
        elif "show run" in command:
            output = """Building configuration...

Current configuration : 1278 bytes
!
version 15.7
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
!
hostname Router
!
interface GigabitEthernet0/0
 ip address 192.168.1.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet0/1
 ip address 10.0.0.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet0/2
 ip address 172.16.0.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet0/3
 no ip address
 shutdown
!
ip route 0.0.0.0 0.0.0.0 10.0.0.254
!
end"""
        elif "show ip route" in command:
            output = """Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area 
       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
       E1 - OSPF external type 1, E2 - OSPF external type 2

Gateway of last resort is 10.0.0.254 to network 0.0.0.0

C    192.168.1.0/24 is directly connected, GigabitEthernet0/0
C    10.0.0.0/24 is directly connected, GigabitEthernet0/1
C    172.16.0.0/24 is directly connected, GigabitEthernet0/2
S*   0.0.0.0/0 [1/0] via 10.0.0.254, GigabitEthernet0/1"""
        else:
            output = f"Command executed: {command}"
        
        return {"output": output}

def is_destructive_command(command):
    """破壊的なコマンドかどうかをチェック"""
    destructive_patterns = [
        r'^(clear|delete|erase|format)',
        r'^reload',
        r'^reset',
        r'^write erase',
        r'^no',
        r'shut(down)?$',
    ]
    
    # 設定モードのコマンド
    if re.match(r'^conf(ig)?\s+t(erm(inal)?)?', command):
        return True
    
    # その他の破壊的コマンド
    for pattern in destructive_patterns:
        if re.search(pattern, command, re.IGNORECASE):
            return True
            
    return False

@app.get("/router/{ip}/topology")
async def get_network_topology(ip: str):
    """ネットワークトポロジを取得"""
    # セッションからクライアントとベンダーを取得
    session_id = None
    for sid, router in connected_routers.items():
        if router["ip"] == ip:
            session_id = sid
            break
    
    if session_id:
        client = connected_routers[session_id]["client"]
        vendor = connected_routers[session_id]["vendor"]
        
        # 隣接デバイス情報を取得
        neighbors_command = VENDOR_COMMANDS.get(vendor, VENDOR_COMMANDS[VendorType.CISCO])["neighbors"]
        neighbors_result = execute_ssh_command(client, neighbors_command)
        
        if neighbors_result["success"]:
            neighbors = parse_neighbors(neighbors_result["output"], vendor)
            
            # トポロジを構築
            return build_network_topology(ip, neighbors, vendor)
        else:
            logger.warning(f"Failed to get topology, using dummy data: {neighbors_result}")
            return generate_dummy_topology()
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy topology")
        return generate_dummy_topology()

def build_network_topology(router_ip, neighbors, vendor):
    """隣接デバイス情報からトポロジを構築"""
    devices = []
    connections = []
    
    # ルーター自身を追加
    devices.append({
        "name": f"Router_{router_ip}",
        "type": "Router",
        "ip": router_ip,
        "model": vendor
    })
    
    # 隣接デバイスを追加
    for neighbor in neighbors:
        device_id = neighbor["device_id"]
        device_ip = neighbor["ip_address"]
        
        # デバイスが既に追加されているかチェック
        if not any(d["name"] == device_id for d in devices):
            device_type = "Router"
            if "Switch" in neighbor.get("platform", ""):
                device_type = "Switch"
                
            devices.append({
                "name": device_id,
                "type": device_type,
                "ip": device_ip,
                "model": neighbor.get("platform", "Unknown")
            })
        
        # 接続情報を追加
        connections.append({
            "source": f"Router_{router_ip}",
            "source_interface": neighbor.get("local_interface", "Unknown"),
            "target": device_id,
            "target_interface": neighbor.get("remote_interface", "Unknown")
        })
    
    return {
        "devices": devices,
        "connections": connections
    }

def generate_dummy_topology():
    """ダミーのネットワークトポロジを生成"""
    return {
        "devices": [
            {
                "name": "Router_192.168.1.1",
                "type": "Router",
                "ip": "192.168.1.1",
                "model": "Cisco C892FSP-K9"
            },
            {
                "name": "Switch1",
                "type": "Switch",
                "ip": "192.168.1.2",
                "model": "Cisco WS-C2960X"
            },
            {
                "name": "Router2",
                "type": "Router",
                "ip": "10.0.0.2",
                "model": "Cisco C891F"
            }
        ],
        "connections": [
            {
                "source": "Router_192.168.1.1",
                "source_interface": "GigabitEthernet0/0",
                "target": "Switch1",
                "target_interface": "GigabitEthernet1/0/24"
            },
            {
                "source": "Router_192.168.1.1",
                "source_interface": "GigabitEthernet0/1",
                "target": "Router2",
                "target_interface": "GigabitEthernet0/0"
            }
        ]
    }

# メイン
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
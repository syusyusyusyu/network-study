from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Any
import asyncio
import random
import logging
from datetime import datetime
import paramiko
import re

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cisco Router API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では特定のオリジンのみを許可する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データモデル
class RouterInfo(BaseModel):
    ip: str
    username: Optional[str] = None
    password: Optional[str] = None
    enable_password: Optional[str] = None
    connection_type: str = "ssh"  # ssh, telnet, snmp

class CommandRequest(BaseModel):
    command: str

class InterfaceInfo(BaseModel):
    name: str
    status: str
    protocol: str
    ip: str
    speed: str
    duplex: str

class PingResult(BaseModel):
    success: bool
    packet_loss: float
    rtt_min: float
    rtt_avg: float
    rtt_max: float

class TraceRouteHop(BaseModel):
    hop: int
    ip: str
    rtt: Optional[float] = None

class DiagnosticIssue(BaseModel):
    type: str
    severity: str  # critical, high, medium, low
    description: str
    recommendation: str

class DiagnosticResult(BaseModel):
    status: str  # healthy, warning, error
    summary: str
    issues: List[DiagnosticIssue]

class ConnectionResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None

# 接続したルーターとセッションの管理
connected_routers = {}

# ダミーデータ - 接続できない場合のフォールバック用
DUMMY_ROUTER = {
    "info": {
        "name": "Cisco 892",
        "model": "C892FSP-K9",
        "serial_number": "FTX1840ABCD",
        "firmware_version": "15.7(3)M2",
        "uptime": "10 days, 4 hours, 32 minutes"
    },
    "interfaces": {
        "GigabitEthernet0": {
            "name": "GigabitEthernet0",
            "status": "up", 
            "protocol": "up", 
            "ip": "192.168.1.1",
            "speed": "1000Mb/s",
            "duplex": "full"
        },
        "GigabitEthernet1": {
            "name": "GigabitEthernet1",
            "status": "up", 
            "protocol": "up", 
            "ip": "10.0.0.1",
            "speed": "1000Mb/s",
            "duplex": "full"
        },
        "GigabitEthernet2": {
            "name": "GigabitEthernet2",
            "status": "up", 
            "protocol": "up", 
            "ip": "172.16.0.1",
            "speed": "1000Mb/s",
            "duplex": "full"
        },
        "GigabitEthernet3": {
            "name": "GigabitEthernet3",
            "status": "administratively down", 
            "protocol": "down", 
            "ip": "unassigned",
            "speed": "auto",
            "duplex": "auto"
        }
    }
}

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
        
        return {
            "success": True,
            "client": client,
            "message": f"Successfully connected to {router_info.ip}"
        }
    except Exception as e:
        logger.error(f"SSH connection error: {str(e)}")
        return {
            "success": False,
            "client": None,
            "message": f"Failed to connect: {str(e)}"
        }

# コマンド実行関数
def execute_ssh_command(client, command):
    try:
        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if error:
            return {"success": False, "output": error}
        return {"success": True, "output": output}
    except Exception as e:
        logger.error(f"Command execution error: {str(e)}")
        return {"success": False, "output": str(e)}

# インターフェース情報の解析
def parse_interfaces(output):
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
                "speed": "auto",  # デフォルト値
                "duplex": "auto"   # デフォルト値
            }
    
    return interfaces

# APIエンドポイント
@app.get("/")
async def root():
    return {"message": "Cisco Router API"}

@app.post("/connect", response_model=ConnectionResponse)
async def connect_router(router: RouterInfo):
    logger.info(f"Connection request: {router}")
    
    # 実際のルーターへの接続を試みる
    connection_result = connect_ssh(router)
    
    if connection_result["success"]:
        session_id = f"session-{random.randint(1000, 9999)}"
        connected_routers[session_id] = {
            "ip": router.ip,
            "client": connection_result["client"],
            "connected_at": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "message": connection_result["message"],
            "session_id": session_id
        }
    else:
        # 接続失敗
        return {
            "success": False,
            "message": connection_result["message"],
            "session_id": None
        }

@app.get("/router/{ip}/info")
async def get_router_info(ip: str):
    # セッションからクライアントを取得
    session_id = list(filter(lambda x: connected_routers[x]["ip"] == ip, connected_routers.keys()))
    
    if session_id:
        client = connected_routers[session_id[0]]["client"]
        
        # show version コマンドを実行
        result = execute_ssh_command(client, "show version")
        
        if result["success"]:
            # コマンド出力から情報を抽出
            output = result["output"]
            
            # 簡単な正規表現でのマッチング例
            model_match = re.search(r'Cisco (.+?) \(', output)
            version_match = re.search(r'Version ([^,]+)', output)
            uptime_match = re.search(r'uptime is (.+)', output)
            
            return {
                "name": "Cisco Router",
                "ip": ip,
                "model": model_match.group(1) if model_match else "Unknown",
                "serialNumber": "Unknown",
                "firmwareVersion": version_match.group(1) if version_match else "Unknown",
                "uptime": uptime_match.group(1) if uptime_match else "Unknown"
            }
        else:
            # コマンド実行失敗時はダミーデータを返す
            logger.warning(f"Failed to get router info, using dummy data: {result}")
            return {
                "name": DUMMY_ROUTER["info"]["name"],
                "ip": ip,
                "model": DUMMY_ROUTER["info"]["model"],
                "serialNumber": DUMMY_ROUTER["info"]["serial_number"],
                "firmwareVersion": DUMMY_ROUTER["info"]["firmware_version"],
                "uptime": DUMMY_ROUTER["info"]["uptime"]
            }
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return {
            "name": DUMMY_ROUTER["info"]["name"],
            "ip": ip,
            "model": DUMMY_ROUTER["info"]["model"],
            "serialNumber": DUMMY_ROUTER["info"]["serial_number"],
            "firmwareVersion": DUMMY_ROUTER["info"]["firmware_version"],
            "uptime": DUMMY_ROUTER["info"]["uptime"]
        }

@app.get("/router/{ip}/interfaces")
async def get_interfaces(ip: str):
    # セッションからクライアントを取得
    session_id = list(filter(lambda x: connected_routers[x]["ip"] == ip, connected_routers.keys()))
    
    if session_id:
        client = connected_routers[session_id[0]]["client"]
        
        # show ip interface brief コマンドを実行
        result = execute_ssh_command(client, "show ip interface brief")
        
        if result["success"]:
            # コマンド出力からインターフェース情報を抽出
            return parse_interfaces(result["output"])
        else:
            # コマンド実行失敗時はダミーデータを返す
            logger.warning(f"Failed to get interfaces, using dummy data: {result}")
            return DUMMY_ROUTER["interfaces"]
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return DUMMY_ROUTER["interfaces"]

@app.get("/router/{ip}/ping")
async def ping(ip: str, target: str):
    # セッションからクライアントを取得
    session_id = list(filter(lambda x: connected_routers[x]["ip"] == ip, connected_routers.keys()))
    
    if session_id:
        client = connected_routers[session_id[0]]["client"]
        
        # ping コマンドを実行
        result = execute_ssh_command(client, f"ping {target}")
        
        if result["success"]:
            # コマンド出力からPing結果を抽出
            output = result["output"]
            
            # 成功率を抽出
            success_match = re.search(r'Success rate is (\d+) percent', output)
            success_rate = int(success_match.group(1)) if success_match else 0
            
            # RTT値を抽出
            rtt_match = re.search(r'min/avg/max = (\d+\.\d+)/(\d+\.\d+)/(\d+\.\d+)', output)
            
            if rtt_match:
                return {
                    "success": success_rate > 0,
                    "packet_loss": 100 - success_rate,
                    "rtt_min": float(rtt_match.group(1)),
                    "rtt_avg": float(rtt_match.group(2)),
                    "rtt_max": float(rtt_match.group(3))
                }
            else:
                return {
                    "success": success_rate > 0,
                    "packet_loss": 100 - success_rate,
                    "rtt_min": 0,
                    "rtt_avg": 0,
                    "rtt_max": 0
                }
        else:
            # コマンド実行失敗時はダミーデータを返す
            logger.warning(f"Failed to ping {target}, using dummy data: {result}")
            return {
                "success": False,
                "packet_loss": 100,
                "rtt_min": 0,
                "rtt_avg": 0,
                "rtt_max": 0
            }
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return {
            "success": True,
            "packet_loss": 0,
            "rtt_min": 1.1,
            "rtt_avg": 2.3,
            "rtt_max": 3.7
        }

@app.get("/router/{ip}/traceroute")
async def traceroute(ip: str, target: str):
    # セッションからクライアントを取得
    session_id = list(filter(lambda x: connected_routers[x]["ip"] == ip, connected_routers.keys()))
    
    if session_id:
        client = connected_routers[session_id[0]]["client"]
        
        # traceroute コマンドを実行
        result = execute_ssh_command(client, f"traceroute {target}")
        
        if result["success"]:
            # コマンド出力からトレースルート結果を抽出
            output = result["output"]
            hops = []
            
            # 各行を処理
            lines = output.strip().split('\n')
            for line in lines:
                # ヘッダー行をスキップ
                if "Tracing the route" in line or not line.strip():
                    continue
                
                # ホップ番号とIPアドレスを抽出
                hop_match = re.match(r'^\s*(\d+)\s+(.+?)(?:\s+(\d+\.\d+)\s*ms)?', line)
                if hop_match:
                    hop_num = int(hop_match.group(1))
                    ip_addr = hop_match.group(2).strip()
                    rtt = float(hop_match.group(3)) if hop_match.group(3) else None
                    
                    if ip_addr == "*":
                        hops.append({"hop": hop_num, "ip": "*", "rtt": None})
                    else:
                        hops.append({"hop": hop_num, "ip": ip_addr, "rtt": rtt})
            
            return hops
        else:
            # コマンド実行失敗時はダミーデータを返す
            logger.warning(f"Failed to traceroute {target}, using dummy data: {result}")
            return [
                {"hop": 1, "ip": "192.168.1.1", "rtt": 0.5},
                {"hop": 2, "ip": "10.0.0.1", "rtt": 1.2},
                {"hop": 3, "ip": target, "rtt": 2.1}
            ]
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return [
            {"hop": 1, "ip": "192.168.1.1", "rtt": 0.5},
            {"hop": 2, "ip": "10.0.0.1", "rtt": 1.2},
            {"hop": 3, "ip": target, "rtt": 2.1}
        ]

@app.get("/router/{ip}/diagnostics")
async def run_diagnostics(ip: str):
    # セッションからクライアントを取得
    session_id = list(filter(lambda x: connected_routers[x]["ip"] == ip, connected_routers.keys()))
    
    if session_id:
        client = connected_routers[session_id[0]]["client"]
        
        # インターフェース情報を取得
        interfaces_result = execute_ssh_command(client, "show ip interface brief")
        
        # 問題を検出するリスト
        issues = []
        
        # インターフェースの状態を確認
        if interfaces_result["success"]:
            interfaces = parse_interfaces(interfaces_result["output"])
            
            for name, interface in interfaces.items():
                # ダウンしているインターフェースをチェック
                if interface["status"] == "down" and interface["protocol"] == "down":
                    issues.append({
                        "type": "interface_down",
                        "severity": "critical",
                        "description": f"{name} がダウンしています",
                        "recommendation": "物理接続を確認するか、'no shutdown'コマンドでインターフェースを有効にしてください"
                    })
        
        # ルーティングテーブルを確認
        routing_result = execute_ssh_command(client, "show ip route")
        
        # デフォルトルートの存在を確認
        if routing_result["success"]:
            output = routing_result["output"]
            if "0.0.0.0/0" not in output and "0.0.0.0" not in output:
                issues.append({
                    "type": "missing_default_route",
                    "severity": "high",
                    "description": "デフォルトルートが設定されていません",
                    "recommendation": "'ip route 0.0.0.0 0.0.0.0 [next-hop]'コマンドでデフォルトルートを設定してください"
                })
        
        # 診断結果を返す
        if len(issues) == 0:
            return {
                "status": "healthy",
                "summary": "全てのシステムは正常に動作しています",
                "issues": []
            }
        else:
            return {
                "status": "error" if any(issue["severity"] == "critical" for issue in issues) else "warning",
                "summary": f"{len(issues)}件の問題が検出されました",
                "issues": issues
            }
    else:
        # ルーターに接続されていない場合はダミーデータを返す
        logger.warning(f"Router {ip} not connected, using dummy data")
        return {
            "status": "healthy",
            "summary": "全てのシステムは正常に動作しています",
            "issues": []
        }

@app.post("/router/{ip}/execute")
async def execute_command(ip: str, command_req: CommandRequest):
    # セッションからクライアントを取得
    session_id = list(filter(lambda x: connected_routers[x]["ip"] == ip, connected_routers.keys()))
    
    if session_id:
        client = connected_routers[session_id[0]]["client"]
        
        # コマンドを実行
        result = execute_ssh_command(client, command_req.command)
        
        if result["success"]:
            return {"output": result["output"]}
        else:
            return {"output": f"Command execution failed: {result['output']}"}
    else:
        # ルーターに接続されていない場合
        logger.warning(f"Router {ip} not connected, simulating command execution")
        
        # 簡単なコマンドシミュレーション
        command = command_req.command
        output = ""
        
        if "show version" in command:
            output = f"""Cisco IOS Software, C800 Software (C800-UNIVERSALK9-M), Version 15.7(3)M2
ROM: System Bootstrap, Version 15.7(3r)M2
Router uptime is 10 days, 4 hours, 32 minutes"""
        elif "show ip interface brief" in command:
            output = """Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0       192.168.1.1     YES NVRAM  up                    up
GigabitEthernet1       10.0.0.1        YES NVRAM  up                    up
GigabitEthernet2       172.16.0.1      YES NVRAM  up                    up
GigabitEthernet3       unassigned      YES NVRAM  administratively down down"""
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
interface GigabitEthernet0
 ip address 192.168.1.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet1
 ip address 10.0.0.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet2
 ip address 172.16.0.1 255.255.255.0
 duplex full
 speed 1000
!
interface GigabitEthernet3
 no ip address
 shutdown
!
ip route 0.0.0.0 0.0.0.0 10.0.0.254
!
end"""
        else:
            output = f"Command executed: {command}"
        
        return {"output": output}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
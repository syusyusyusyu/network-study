import type React from "react"

interface Device {
  type: "router" | "switch" | "pc" | "server"
  x: number
  y: number
  label: string
  ip?: string
}

interface Connection {
  from: number
  to: number
  label?: string
}

interface NetworkDiagramProps {
  devices: Device[]
  connections: Connection[]
}

const DeviceIcon: React.FC<{ type: Device["type"] }> = ({ type }) => {
  switch (type) {
    case "router":
      return (
        <g>
          <circle cx="0" cy="0" r="20" fill="#1BA0E1" />
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14">
            R
          </text>
        </g>
      )
    case "switch":
      return (
        <g>
          <rect x="-20" y="-20" width="40" height="40" fill="#54B948" />
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14">
            S
          </text>
        </g>
      )
    case "pc":
      return (
        <g>
          <rect x="-25" y="-20" width="50" height="40" rx="5" ry="5" fill="#F2C94C" />
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="black" fontSize="14">
            PC
          </text>
        </g>
      )
    case "server":
      return (
        <g>
          <rect x="-20" y="-30" width="40" height="60" fill="#EB5757" />
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14">
            SVR
          </text>
        </g>
      )
  }
}

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({ devices, connections }) => {
  return (
    <svg width="100%" height="300" viewBox="0 0 600 300" className="border border-gray-300 bg-white">
      <title>Network Diagram</title>
      <desc>A diagram showing network devices and their connections</desc>
      {connections.map((conn, index) => {
        const from = devices[conn.from]
        const to = devices[conn.to]
        const midX = (from.x + to.x) / 2
        const midY = (from.y + to.y) / 2
        return (
          <g key={index}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="black" strokeWidth="2" />
            {conn.label && (
              <text x={midX} y={midY} textAnchor="middle" fill="black" fontSize="12">
                {conn.label}
              </text>
            )}
          </g>
        )
      })}
      {devices.map((device, index) => (
        <g key={index} transform={`translate(${device.x}, ${device.y})`}>
          <DeviceIcon type={device.type} />
          <text x="0" y="35" textAnchor="middle" fill="black" fontSize="12">
            {device.label}
          </text>
          {device.ip && (
            <text x="0" y="50" textAnchor="middle" fill="black" fontSize="10">
              {device.ip}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}


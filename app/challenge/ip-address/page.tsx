"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"

const devices = [
  { type: "router" as const, x: 300, y: 50, label: "R1", ip: "192.168.100.1" },
  { type: "switch" as const, x: 300, y: 150, label: "S1" },
  { type: "pc" as const, x: 150, y: 250, label: "PC1" },
  { type: "pc" as const, x: 300, y: 250, label: "PC2" },
  { type: "server" as const, x: 450, y: 250, label: "Server" },
]

const connections = [
  { from: 0, to: 1, label: "Gi0/0" },
  { from: 1, to: 2, label: "Fa0/1" },
  { from: 1, to: 3, label: "Fa0/2" },
  { from: 1, to: 4, label: "Fa0/3" },
]

export default function IPAddressChallengePage() {
  const [subnetMask, setSubnetMask] = useState("")
  const [availableHosts, setAvailableHosts] = useState("")
  const [broadcastAddress, setBroadcastAddress] = useState("")
  const [feedback1, setFeedback1] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkSubnetMask = () => {
    if (subnetMask === "255.255.255.224") {
      setFeedback1("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else {
      setFeedback1(
        "惜しい！もう一度計算してみよう。27ビットのネットワーク部を持つサブネットマスクを考えてください。 🤔",
      )
    }
  }

  const checkAvailableHosts = () => {
    if (availableHosts === "30") {
      setFeedback2("正解です！素晴らしい計算です！ 🎉")
      setProgress((prev) => prev + 33)
    } else {
      setFeedback2("もう一度計算してみよう。サブネットマスクから利用可能なホスト数を導き出してください。 💪")
    }
  }

  const checkBroadcastAddress = () => {
    if (broadcastAddress === "192.168.100.31") {
      setFeedback3("正解です！完璧です！ 🎉")
      setProgress((prev) => prev + 34)
    } else {
      setFeedback3("惜しい！もう一度計算してみよう。このサブネットの最後のアドレスがブロードキャストアドレスです。 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="IPアドレス設定チャレンジ" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          ネットワーク管理者として、以下の条件に基づいてサブネットを設計する必要があります：
        </p>
        <ul className="list-disc list-inside mb-4 text-sm">
          <li>ネットワークアドレス: 192.168.100.0</li>
          <li>必要なサブネット数: 8</li>
          <li>各サブネットで必要なホスト数: 最低25台</li>
        </ul>

        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold">1. このサブネットに適切なサブネットマスクは何ですか？</p>
            <Input
              type="text"
              placeholder="サブネットマスクを入力"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              className="bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkSubnetMask} className="mt-2 bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
            {feedback1 && (
              <p className={`mt-2 ${feedback1.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>{feedback1}</p>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold">2. 各サブネットで利用可能なホスト数は何台ですか？</p>
            <Input
              type="number"
              placeholder="利用可能なホスト数を入力"
              value={availableHosts}
              onChange={(e) => setAvailableHosts(e.target.value)}
              className="bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkAvailableHosts} className="mt-2 bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
            {feedback2 && (
              <p className={`mt-2 ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>{feedback2}</p>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold">3. 最初のサブネットのブロードキャストアドレスは何ですか？</p>
            <Input
              type="text"
              placeholder="ブロードキャストアドレスを入力"
              value={broadcastAddress}
              onChange={(e) => setBroadcastAddress(e.target.value)}
              className="bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkBroadcastAddress} className="mt-2 bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
            {feedback3 && (
              <p className={`mt-2 ${feedback3.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>{feedback3}</p>
            )}
          </div>
        </div>

        <Progress value={progress} className="mt-4 mb-2 h-3 md:h-4 rounded-full" />
        <p className="text-base md:text-lg text-gray-200 mb-4">進捗: {progress}% 🚀</p>

        <Button onClick={toggleHint} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          {showHint ? "ヒントを隠す 🙈" : "ヒントを見る 💡"}
        </Button>

        {showHint && (
          <div className="mt-4 bg-blue-100 bg-opacity-20 p-4 rounded-lg">
            <p className="text-base md:text-lg text-white">
              <strong>ヒント:</strong>
              <br />
              1. 8つのサブネットを作るには、ネットワーク部に3ビット必要です（2^3 = 8）。
              <br />
              2. 利用可能なホスト数は、2^(ホスト部のビット数) - 2 で計算できます。
              <br />
              3. ブロードキャストアドレスは、サブネットの最後のアドレスです。サブネットのサイズを考えてみましょう。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


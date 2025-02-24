"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const devices = [
  { type: "router" as const, x: 200, y: 100, label: "ルーターA", ip: "192.168.1.1" },
  { type: "router" as const, x: 400, y: 100, label: "ルーターB", ip: "10.0.0.1" },
  { type: "pc" as const, x: 100, y: 200, label: "PC1", ip: "192.168.1.10" },
  { type: "pc" as const, x: 500, y: 200, label: "PC2", ip: "10.0.0.10" },
]

const connections = [
  { from: 0, to: 1, label: "WAN" },
  { from: 0, to: 2, label: "LAN1" },
  { from: 1, to: 3, label: "LAN2" },
]

export default function RoutingLearnPage() {
  const [nextHop, setNextHop] = useState("")
  const [defaultGateway, setDefaultGateway] = useState("")
  const [routingProtocol, setRoutingProtocol] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkNextHop = () => {
    if (nextHop.trim() === "10.0.0.1") {
      setFeedback("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else if (nextHop.startsWith("10.0.0.")) {
      setFeedback("惜しい！正しいネットワークですが、具体的なアドレスを考えてみよう。 🤔")
      setProgress((prev) => Math.min(prev + 16, 100))
    } else {
      setFeedback("もう一度考えてみよう。ルーターBのIPアドレスに注目してね。 💪")
    }
  }

  const checkDefaultGateway = () => {
    if (defaultGateway === "192.168.1.1") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else {
      setFeedback2("もう一度考えてみよう。PC1が接続しているルーターのIPアドレスを確認してね。 💪")
    }
  }

  const checkRoutingProtocol = () => {
    if (routingProtocol === "ospf") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 34, 100))
    } else {
      setFeedback3(
        "もう一度考えてみよう。大規模ネットワークで一般的に使用される動的ルーティングプロトコルはどれでしょうか？ 💪",
      )
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="道案内マスター 🗺️" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="mt-6 space-y-4">
          <p className="text-lg">上の図は、2つのネットワークがルーターで接続されている様子を表しています。</p>
          <p className="text-lg">
            ルーティングとは、データパケットが目的地に到達するための最適な経路を決定することです。
            ルーターAは、異なるネットワーク宛てのパケットをどこに送ればいいか知っている必要があります。
          </p>
          <p className="text-lg font-semibold">
            PC1からPC2にデータを送る場合、ルーターAの次のホップ（転送先）のIPアドレスは何になるでしょうか？
          </p>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-2">
          <Input
            type="text"
            placeholder="次のホップのIPアドレスを入力"
            value={nextHop}
            onChange={(e) => setNextHop(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkNextHop} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback && (
          <p className={`mt-4 text-lg ${feedback.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">PC1のデフォルトゲートウェイは何になるでしょうか？</p>
          <RadioGroup value={defaultGateway} onValueChange={setDefaultGateway}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="192.168.1.1" id="r1" />
              <Label htmlFor="r1">192.168.1.1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="10.0.0.1" id="r2" />
              <Label htmlFor="r2">10.0.0.1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="192.168.1.10" id="r3" />
              <Label htmlFor="r3">192.168.1.10</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkDefaultGateway} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">
            大規模ネットワークで一般的に使用される動的ルーティングプロトコルはどれですか？
          </p>
          <RadioGroup value={routingProtocol} onValueChange={setRoutingProtocol}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rip" id="rp1" />
              <Label htmlFor="rp1">RIP</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ospf" id="rp2" />
              <Label htmlFor="rp2">OSPF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bgp" id="rp3" />
              <Label htmlFor="rp3">BGP</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkRoutingProtocol} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback3 && (
          <p className={`mt-4 text-lg ${feedback3.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback3}
          </p>
        )}

        <Progress value={progress} className="mt-4 mb-2 h-3 md:h-4 rounded-full" />
        <p className="text-base md:text-lg text-gray-200 mb-4">理解度: {progress}% 🚀</p>

        <Button onClick={toggleHint} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          {showHint ? "ヒントを隠す 🙈" : "ヒントを見る 💡"}
        </Button>

        {showHint && (
          <div className="mt-4 bg-blue-100 bg-opacity-20 p-4 rounded-lg">
            <p className="text-base md:text-lg text-white">
              <strong>ヒント:</strong> PC2は10.0.0.0ネットワークにあります。
              ルーターAからこのネットワークに到達するには、直接接続されているルーターBを経由する必要があります。
              ルーターBのIPアドレスに注目してください。
              デフォルトゲートウェイは、PCが自分のネットワーク外と通信する際に使用するルーターのIPアドレスです。
              動的ルーティングプロトコルは、ネットワークの変更に自動的に対応できます。OSPFは、大規模ネットワークで広く使用されています。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


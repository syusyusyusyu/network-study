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
  { type: "router" as const, x: 200, y: 100, label: "ルータA", ip: "192.168.1.1" },
  { type: "router" as const, x: 400, y: 100, label: "ルータB", ip: "10.0.0.1" },
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
  const [routeCommand, setRouteCommand] = useState("")
  const [defaultRoute, setDefaultRoute] = useState("")
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
      setFeedback("もう一度考えてみよう。ルータBのIPアドレスに注目してね。 💪")
    }
  }

  const checkRouteCommand = () => {
    if (routeCommand === "b") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else {
      setFeedback2("もう一度考えてみよう。スタティックルートの設定に必要な情報を思い出してね。 💪")
    }
  }

  const checkDefaultRoute = () => {
    if (defaultRoute === "c") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 34, 100))
    } else {
      setFeedback3("もう一度考えてみよう。デフォルトルートの役割を思い出してください。 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="スタティックルーティング 🗺️" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="mt-6 space-y-4">
          <p className="text-lg">上の図は、2つのネットワークがルータで接続されている様子を表しています。</p>
          <p className="text-lg">
            スタティックルーティングでは、管理者が手動でルーティングテーブルを設定します。
            ルータAは、10.0.0.0/24ネットワーク宛てのパケットをどこに送ればいいか知っている必要があります。
          </p>
          <p className="text-lg font-semibold">
            ルータAから10.0.0.0/24ネットワークへのスタティックルートを設定する場合、次のホップ（転送先）のIPアドレスは何になるでしょうか？
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
          <p className="text-lg font-semibold">スタティックルートを設定する際に必要な情報は何ですか？</p>
          <RadioGroup value={routeCommand} onValueChange={setRouteCommand}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="r1" />
              <Label htmlFor="r1">送信元IPアドレス、宛先IPアドレス、ポート番号</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="r2" />
              <Label htmlFor="r2">宛先ネットワーク、サブネットマスク、ネクストホップ</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="r3" />
              <Label htmlFor="r3">MACアドレス、IPアドレス、デフォルトゲートウェイ</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkRouteCommand} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">デフォルトルート（0.0.0.0/0）の役割は何ですか？</p>
          <RadioGroup value={defaultRoute} onValueChange={setDefaultRoute}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="dr1" />
              <Label htmlFor="dr1">最も高速なルートを選択する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="dr2" />
              <Label htmlFor="dr2">ルーティングテーブルを自動的に更新する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="dr3" />
              <Label htmlFor="dr3">他のルートが一致しない場合に使用される</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkDefaultRoute} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong> スタティックルートを設定する際は、宛先ネットワーク、サブネットマスク、
              そして次のホップ（またはインターフェース）を指定します。次のホップは、直接接続されているルーターのIPアドレスになります。
              デフォルトルートは、ルーティングテーブル内の他のルートが宛先と一致しない場合に使用される「最後の手段」のルートです。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


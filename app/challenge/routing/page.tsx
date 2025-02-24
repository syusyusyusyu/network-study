"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const devices = [
  { type: "router" as const, x: 200, y: 50, label: "R1", ip: "10.0.0.1" },
  { type: "router" as const, x: 400, y: 50, label: "R2", ip: "10.0.0.2" },
  { type: "pc" as const, x: 100, y: 150, label: "PC1", ip: "192.168.1.2" },
  { type: "server" as const, x: 500, y: 150, label: "Server", ip: "192.168.2.2" },
]

const connections = [
  { from: 0, to: 1, label: "Se0/0/0" },
  { from: 0, to: 2, label: "Gi0/0" },
  { from: 1, to: 3, label: "Gi0/0" },
]

export default function RoutingChallengePage() {
  const [answer, setAnswer] = useState("")
  const [defaultRoute, setDefaultRoute] = useState("")
  const [routingTable, setRoutingTable] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkAnswer = () => {
    const requiredCommands = [
      /ip route 192\.168\.2\.0 255\.255\.255\.0 10\.0\.0\.2/i,
      /interface serial0\/0\/0/i,
      /ip address 10\.0\.0\.1 255\.255\.255\.252/i,
      /no shutdown/i,
    ]

    const score = requiredCommands.filter((cmd) => cmd.test(answer)).length
    const newProgress = (score / requiredCommands.length) * 33

    setProgress(newProgress)

    if (newProgress === 33) {
      setFeedback("素晴らしい！正しいルーティング設定です！ 🎉")
    } else {
      setFeedback("惜しい！もう一度確認してみよう。すべての必要なコマンドが含まれているか確認してください。 🤔")
    }
  }

  const checkDefaultRoute = () => {
    if (defaultRoute === "b") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 33)
    } else {
      setFeedback2("もう一度考えてみよう。デフォルトルートの形式を思い出してください。 💪")
    }
  }

  const checkRoutingTable = () => {
    if (routingTable === "c") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 34)
    } else {
      setFeedback3("もう一度考えてみよう。スタティックルートがどのように表示されるか考えてみてください。 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="スタティックルーティングチャレンジ" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          2つのネットワークを接続するスタティックルーティング設定を行います。R1のコンフィギュレーションモードで以下の設定を行ってください：
        </p>
        <ul className="list-disc list-inside mb-4 text-sm">
          <li>R2のネットワーク(192.168.2.0/24)へのスタティックルートを設定</li>
          <li>Serial0/0/0インターフェースにIPアドレスを設定(10.0.0.1/30)</li>
          <li>Serial0/0/0インターフェースを有効化</li>
        </ul>

        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="bg-black bg-opacity-50 text-green-400 font-mono placeholder-gray-500"
          placeholder="ここにコマンドを入力してください..."
          rows={6}
        />

        <Button onClick={checkAnswer} className="mt-6 text-lg bg-green-500 hover:bg-green-600 text-white">
          設定をチェック
        </Button>

        {feedback && (
          <p className={`mt-4 text-lg ${feedback.includes("素晴らしい") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">R1にデフォルトルートを設定する場合、正しいコマンドはどれですか？</p>
          <RadioGroup value={defaultRoute} onValueChange={setDefaultRoute}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="r1" />
              <Label htmlFor="r1">ip route 0.0.0.0 0.0.0.0 Serial0/0/0</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="r2" />
              <Label htmlFor="r2">ip route 0.0.0.0 0.0.0.0 10.0.0.2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="r3" />
              <Label htmlFor="c">ip default-network 10.0.0.0</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkDefaultRoute} className="bg-green-500 hover:bg-green-600 text-white">
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
            R1のルーティングテーブルで、192.168.2.0/24へのスタティックルートはどのように表示されますか？
          </p>
          <RadioGroup value={routingTable} onValueChange={setRoutingTable}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="rt1" />
              <Label htmlFor="rt1">D 192.168.2.0/24 [90/2170112] via 10.0.0.2, 00:00:05, Serial0/0/0</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="rt2" />
              <Label htmlFor="rt2">C 192.168.2.0/24 is directly connected, Serial0/0/0</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="rt3" />
              <Label htmlFor="rt3">S 192.168.2.0/24 [1/0] via 10.0.0.2</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkRoutingTable} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback3 && (
          <p className={`mt-4 text-lg ${feedback3.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback3}
          </p>
        )}

        <Progress value={progress} className="mt-4 mb-2 h-3 md:h-4 rounded-full" />
        <p className="text-base md:text-lg text-gray-200 mb-4">進捗: {progress}% 🚀</p>

        <Button onClick={toggleHint} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          {showHint ? "ヒントを隠す 🙈" : "ヒントを見る 💡"}
        </Button>

        {showHint && (
          <div className="mt-4 bg-blue-100 bg-opacity-20 p-4 rounded-lg">
            <p className="text-base md:text-lg text-white">
              <strong>ヒント:</strong> スタティックルートの設定には「ip route」コマンドを使用します。
              インターフェースの設定には「interface」コマンドを使用し、その後にIPアドレスの設定と有効化を行います。
              デフォルトルートは0.0.0.0/0のネットワークへのルートです。
              ルーティングテーブルでは、スタティックルートは通常'S'で表示され、その後にネットワーク、メトリック、ネクストホップが続きます。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


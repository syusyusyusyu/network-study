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
  const [routingProtocol, setRoutingProtocol] = useState("")
  const [ospfArea, setOspfArea] = useState("")
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

  const checkRoutingProtocol = () => {
    if (routingProtocol === "ospf") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 33)
    } else {
      setFeedback2(
        "もう一度考えてみよう。大規模ネットワークで一般的に使用される動的ルーティングプロトコルはどれでしょうか？ 💪",
      )
    }
  }

  const checkOSPFArea = () => {
    if (ospfArea === "b") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 34)
    } else {
      setFeedback3("もう一度考えてみよう。OSPFのエリア0の役割を思い出してください。 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="ルーティング設定チャレンジ" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          2つのネットワークを接続するルーティング設定を行います。R1のコンフィギュレーションモードで以下の設定を行ってください：
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
          <p className="text-lg font-semibold">
            大規模ネットワークで一般的に使用される動的ルーティングプロトコルはどれですか？
          </p>
          <RadioGroup value={routingProtocol} onValueChange={setRoutingProtocol}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rip" id="r1" />
              <Label htmlFor="r1">RIP</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ospf" id="r2" />
              <Label htmlFor="r2">OSPF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bgp" id="r3" />
              <Label htmlFor="r3">BGP</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkRoutingProtocol} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">OSPFのエリア0（バックボーンエリア）の役割は何ですか？</p>
          <RadioGroup value={ospfArea} onValueChange={setOspfArea}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="o1" />
              <Label htmlFor="o1">他のエリアからの経路情報を受け取らない</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="o2" />
              <Label htmlFor="o2">すべてのエリアを相互接続する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="o3" />
              <Label htmlFor="o3">外部ネットワークとの接続のみを行う</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkOSPFArea} className="bg-green-500 hover:bg-green-600 text-white">
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
              動的ルーティングプロトコルについては、スケーラビリティと収束速度を考慮してください。
              OSPFのエリア0は、OSPFネットワークの中心的な役割を果たします。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


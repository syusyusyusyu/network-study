"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { Textarea } from "@/components/ui/textarea"

const devices = [
  { type: "router" as const, x: 300, y: 50, label: "R1" },
  { type: "switch" as const, x: 200, y: 150, label: "S1" },
  { type: "switch" as const, x: 400, y: 150, label: "S2" },
  { type: "pc" as const, x: 100, y: 250, label: "PC1" },
  { type: "pc" as const, x: 300, y: 250, label: "PC2" },
  { type: "server" as const, x: 500, y: 250, label: "Server" },
]

const connections = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
]

export default function NetworkTopologyChallengePage() {
  const [answers, setAnswers] = useState({
    routerConfig: "",
    switchConfig: "",
    pcConfig: "",
  })
  const [feedback, setFeedback] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkAnswers = () => {
    const correctAnswers = {
      routerConfig: /interface GigabitEthernet0\/0.*?ip address 192\.168\.1\.1 255\.255\.255\.0.*?no shutdown/is,
      switchConfig: /interface GigabitEthernet0\/1.*?switchport mode access.*?switchport access vlan 10/is,
      pcConfig: /ip 192\.168\.1\.100 255\.255\.255\.0.*?gateway 192\.168\.1\.1/is,
    }

    const score = Object.keys(correctAnswers).filter((key) => correctAnswers[key].test(answers[key])).length
    const newProgress = (score / Object.keys(correctAnswers).length) * 100

    setProgress(newProgress)

    if (newProgress === 100) {
      setFeedback("すべて正解です！素晴らしい設定です！ 🎉")
    } else {
      setFeedback("惜しい！もう一度設定を見直してみよう。 🤔")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="ネットワーク設定チャレンジ 🌐" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="space-y-6 mt-6">
          <div>
            <p className="mb-2 text-lg font-semibold">
              1. R1のGigabitEthernet0/0インターフェースの設定を書いてください。
            </p>
            <Textarea
              placeholder="Router(config)# ..."
              value={answers.routerConfig}
              onChange={(e) => setAnswers({ ...answers, routerConfig: e.target.value })}
              className="bg-black bg-opacity-50 text-green-400 font-mono"
            />
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold">
              2. S1のGigabitEthernet0/1インターフェースをVLAN 10のアクセスポートとして設定してください。
            </p>
            <Textarea
              placeholder="Switch(config)# ..."
              value={answers.switchConfig}
              onChange={(e) => setAnswers({ ...answers, switchConfig: e.target.value })}
              className="bg-black bg-opacity-50 text-green-400 font-mono"
            />
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold">3. PC1のIPアドレスとデフォルトゲートウェイを設定してください。</p>
            <Textarea
              placeholder="PC> ..."
              value={answers.pcConfig}
              onChange={(e) => setAnswers({ ...answers, pcConfig: e.target.value })}
              className="bg-black bg-opacity-50 text-green-400 font-mono"
            />
          </div>
        </div>

        <Button onClick={checkAnswers} className="mt-6 text-lg bg-green-500 hover:bg-green-600 text-white">
          設定をチェック
        </Button>

        {feedback && (
          <p className={`mt-4 text-lg ${feedback.includes("すべて正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback}
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
              <strong>ヒント:</strong>
              <br />
              1. ルーターの設定には、interfaceコマンド、ip addressコマンド、no shutdownコマンドが必要です。
              <br />
              2. スイッチの設定には、interfaceコマンド、switchport modeコマンド、switchport accessコマンドが必要です。
              <br />
              3. PCの設定には、ipコマンドとgatewayコマンドが必要です。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


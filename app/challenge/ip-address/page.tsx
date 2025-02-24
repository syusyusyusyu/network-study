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
  { type: "router" as const, x: 300, y: 50, label: "R1", ip: "192.168.1.1" },
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
  const [answers, setAnswers] = useState({
    pc1: "",
    pc2: "",
    server: "",
  })
  const [networkClass, setNetworkClass] = useState("")
  const [subnetMask, setSubnetMask] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)

  const checkAnswers = () => {
    const correctAnswers = {
      pc1: "192.168.1.2",
      pc2: "192.168.1.3",
      server: "192.168.1.10",
    }

    const score = (Object.keys(correctAnswers) as (keyof typeof answers)[]).filter((key) => answers[key].trim() === correctAnswers[key]).length
    const newProgress = (score / Object.keys(correctAnswers).length) * 33

    setProgress(newProgress)

    if (newProgress === 33) {
      setFeedback("すべて正解です！素晴らしい設定です！ 🎉")
    } else {
      setFeedback("惜しい！もう一度確認してみよう。 🤔")
    }
  }

  const checkNetworkClass = () => {
    if (networkClass === "c") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 33)
    } else {
      setFeedback2("もう一度考えてみよう。192.168.x.xのネットワークはどのクラスに属するでしょうか？ 💪")
    }
  }

  const checkSubnetMask = () => {
    if (subnetMask === "255.255.255.0") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 34)
    } else {
      setFeedback3("もう一度考えてみよう。このネットワークで一般的に使用されるサブネットマスクは何でしょうか？ 💪")
    }
  }

  return (
    <Layout title="IPアドレス設定チャレンジ" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          小規模オフィスのネットワークをセットアップします。以下の条件に従ってIPアドレスを設定してください：
        </p>
        <ul className="list-disc list-inside mb-4 text-sm">
          <li>ネットワークアドレス: 192.168.1.0/24</li>
          <li>ルーター(R1)のIPアドレス: 192.168.1.1</li>

          <li>PC1とPC2には連続したIPアドレスを割り当てる</li>
          <li>サーバーには10番のIPアドレスを割り当てる</li>
        </ul>

        <div className="space-y-4">
          <div>
            <label htmlFor="pc1" className="block text-sm font-medium text-gray-200">
              PC1のIPアドレス
            </label>
            <Input
              id="pc1"
              value={answers.pc1}
              onChange={(e) => setAnswers({ ...answers, pc1: e.target.value })}
              className="bg-white text-black placeholder-gray-500"
              placeholder="例: 192.168.1.2"
            />
          </div>
          <div>
            <label htmlFor="pc2" className="block text-sm font-medium text-gray-200">
              PC2のIPアドレス
            </label>
            <Input
              id="pc2"
              value={answers.pc2}
              onChange={(e) => setAnswers({ ...answers, pc2: e.target.value })}
              className="bg-white text-black placeholder-gray-500"
              placeholder="例: 192.168.1.3"
            />
          </div>
          <div>
            <label htmlFor="server" className="block text-sm font-medium text-gray-200">
              サーバーのIPアドレス
            </label>
            <Input
              id="server"
              value={answers.server}
              onChange={(e) => setAnswers({ ...answers, server: e.target.value })}
              className="bg-white text-black placeholder-gray-500"
              placeholder="例: 192.168.1.10"
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

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">このネットワークは、どのネットワーククラスに属しますか？</p>
          <RadioGroup value={networkClass} onValueChange={setNetworkClass}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="r1" />
              <Label htmlFor="r1">クラスA</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="r2" />
              <Label htmlFor="r2">クラスB</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="r3" />
              <Label htmlFor="r3">クラスC</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkNetworkClass} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">このネットワークで使用されるサブネットマスクは何ですか？</p>
          <RadioGroup value={subnetMask} onValueChange={setSubnetMask}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="255.0.0.0" id="sm1" />
              <Label htmlFor="sm1">255.0.0.0</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="255.255.0.0" id="sm2" />
              <Label htmlFor="sm2">255.255.0.0</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="255.255.255.0" id="sm3" />
              <Label htmlFor="sm3">255.255.255.0</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkSubnetMask} className="bg-green-500 hover:bg-green-600 text-white">
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
      </div>
    </Layout>
  )
}


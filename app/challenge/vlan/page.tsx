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
  { type: "switch" as const, x: 300, y: 50, label: "L3スイッチ" },
  { type: "switch" as const, x: 150, y: 150, label: "スイッチA" },
  { type: "switch" as const, x: 450, y: 150, label: "スイッチB" },
  { type: "pc" as const, x: 75, y: 250, label: "営業部PC", ip: "VLAN 10" },
  { type: "pc" as const, x: 225, y: 250, label: "経理部PC", ip: "VLAN 20" },
  { type: "pc" as const, x: 375, y: 250, label: "開発部PC", ip: "VLAN 30" },
  { type: "server" as const, x: 525, y: 250, label: "サーバ", ip: "VLAN 40" },
]

const connections = [
  { from: 0, to: 1, label: "Trunk" },
  { from: 0, to: 2, label: "Trunk" },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
  { from: 2, to: 6 },
]

export default function VLANChallengePage() {
  const [vlanId, setVlanId] = useState("")
  const [trunkConfig, setTrunkConfig] = useState("")
  const [accessPort, setAccessPort] = useState("")
  const [feedback1, setFeedback1] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkVlanId = () => {
    if (vlanId === "40") {
      setFeedback1("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else {
      setFeedback1("もう一度考えてみよう。サーバーが属するVLAN IDを確認してください。 💪")
    }
  }

  const checkTrunkConfig = () => {
    const correctConfig = "switchport mode trunk"
    if (trunkConfig.toLowerCase().includes(correctConfig)) {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else {
      setFeedback2("もう一度考えてみよう。トランクポートを設定するコマンドを思い出してください。 💪")
    }
  }

  const checkAccessPort = () => {
    if (accessPort === "c") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 34, 100))
    } else {
      setFeedback3("もう一度考えてみよう。アクセスポートの役割を思い出してください。 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="VLANチャレンジ 🌐" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          上の図は、複数のVLANが設定されたネットワークを表しています。以下の質問に答えてください：
        </p>

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">1. サーバーが属するVLAN IDは何ですか？</p>
          <Input
            type="text"
            placeholder="VLAN IDを入力"
            value={vlanId}
            onChange={(e) => setVlanId(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkVlanId} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback1 && (
          <p className={`mt-4 text-lg ${feedback1.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback1}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">
            2. L3スイッチとスイッチA間のポートをトランクポートとして設定するコマンドは何ですか？
          </p>
          <Input
            type="text"
            placeholder="コマンドを入力"
            value={trunkConfig}
            onChange={(e) => setTrunkConfig(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkTrunkConfig} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">3. アクセスポートの役割は何ですか？</p>
          <RadioGroup value={accessPort} onValueChange={setAccessPort}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="a1" />
              <Label htmlFor="a1">複数のVLANのトラフィックを伝送する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="a2" />
              <Label htmlFor="a2">VLANを作成する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="a3" />
              <Label htmlFor="a3">単一のVLANにデバイスを接続する</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkAccessPort} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong>
              <br />
              1. 図中のサーバーのラベルを確認してください。
              <br />
              2. トランクポートの設定には、特定のコマンドを使用します。通常は "switchport mode ..." の形式です。
              <br />
              3. アクセスポートは、エンドデバイス（PCやサーバーなど）を特定のVLANに接続するために使用されます。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


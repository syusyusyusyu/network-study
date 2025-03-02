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
  { type: "switch" as const, x: 300, y: 50, label: "スイッチ" },
  { type: "pc" as const, x: 100, y: 150, label: "マーケティング部PC", ip: "VLAN 10" },
  { type: "pc" as const, x: 300, y: 150, label: "経理部PC", ip: "VLAN 20" },
  { type: "pc" as const, x: 500, y: 150, label: "開発部PC", ip: "VLAN 30" },
]

const connections = [
  { from: 0, to: 1, label: "ポート1" },
  { from: 0, to: 2, label: "ポート2" },
  { from: 0, to: 3, label: "ポート3" },
]

export default function VLANLearnPage() {
  const [vlanId, setVlanId] = useState("")
  const [vlanPurpose, setVlanPurpose] = useState("")
  const [trunkPort, setTrunkPort] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkVLAN = () => {
    if (vlanId.trim() === "20") {
      setFeedback("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else if (vlanId.trim() === "10" || vlanId.trim() === "30") {
      setFeedback("惜しい！他の部署のVLAN IDですね。もう一度確認してみよう。 🤔")
      setProgress((prev) => Math.min(prev + 16, 100))
    } else {
      setFeedback("もう一度考えてみよう。経理部のPCが属するVLAN IDを探してね。 💪")
    }
  }

  const checkVLANPurpose = () => {
    if (vlanPurpose === "security") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else {
      setFeedback2("もう一度考えてみよう。VLANを使用する主な理由を考えてみてね。 💪")
    }
  }

  const checkTrunkPort = () => {
    if (trunkPort === "b") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 34, 100))
    } else {
      setFeedback3("もう一度考えてみよう。トランクポートの役割を思い出してね。 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="仲間分けの魔法 🧙‍♂️" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="mt-6 space-y-4">
          <p className="text-lg">
            上の図は、1つのスイッチに接続された3つの部署のPCを表しています。
            各部署は異なるVLAN（仮想LAN）に属しています。
          </p>
          <p className="text-lg">
            VLANは、物理的な接続に関係なく、論理的にネットワークを分割する技術です。
            これにより、セキュリティの向上やネットワークの効率化が図れます。
          </p>
          <p className="text-lg font-semibold">経理部のPCが属するVLAN IDは何でしょうか？</p>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-2">
          <Input
            type="text"
            placeholder="VLAN IDを入力"
            value={vlanId}
            onChange={(e) => setVlanId(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkVLAN} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback && (
          <p className={`mt-4 text-lg ${feedback.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">VLANを使用する主な目的は何でしょうか？</p>
          <RadioGroup value={vlanPurpose} onValueChange={setVlanPurpose}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="speed" id="r1" />
              <Label htmlFor="r1">ネットワーク速度の向上</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="security" id="r2" />
              <Label htmlFor="r2">セキュリティの強化</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cost" id="r3" />
              <Label htmlFor="r3">コストの削減</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkVLANPurpose} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">トランクポートの主な役割は何ですか？</p>
          <RadioGroup value={trunkPort} onValueChange={setTrunkPort}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="tp1" />
              <Label htmlFor="tp1">単一のVLANのトラフィックのみを伝送する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="tp2" />
              <Label htmlFor="tp2">複数のVLANのトラフィックを伝送する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="tp3" />
              <Label htmlFor="tp3">VLANを無効にする</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkTrunkPort} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong> 図の中で、各PCに割り当てられているVLAN IDを確認してください。
              経理部のPCに注目すると、答えが見つかるはずです。
              VLANの主な目的は、異なる部門や機能ごとにネットワークを論理的に分離することです。
              これにより、どのような利点が得られるか考えてみましょう。
              トランクポートは、複数のVLANのトラフィックを1つのリンクで伝送するために使用されます。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


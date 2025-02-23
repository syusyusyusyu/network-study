"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function VLANChallengePage() {
  const [vlanId, setVlanId] = useState("")
  const [portNumbers, setPortNumbers] = useState("")
  const [trunkPort, setTrunkPort] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkVLAN = () => {
    const vlanIdValue = Number.parseInt(vlanId)
    const ports = portNumbers
      .split(",")
      .map((port) => Number.parseInt(port.trim()))
      .filter((port) => !isNaN(port))

    if (
      !isNaN(vlanIdValue) &&
      vlanIdValue >= 1 &&
      vlanIdValue <= 4094 &&
      ports.length > 0 &&
      ports.every((port) => port >= 1 && port <= 48)
    ) {
      setFeedback("正しいVLAN設定です！")
      setProgress(50)
    } else {
      const errorMessage = []
      if (isNaN(vlanIdValue) || vlanIdValue < 1 || vlanIdValue > 4094)
        errorMessage.push("VLAN IDは1から4094の範囲内である必要があります")
      if (ports.length === 0) errorMessage.push("少なくとも1つのポート番号を指定してください")
      if (ports.some((port) => port < 1 || port > 48))
        errorMessage.push("ポート番号は1から48の範囲内である必要があります")

      setFeedback(errorMessage.join(", "))
      setProgress(25)
    }
  }

  const checkTrunkPort = () => {
    if (trunkPort === "49") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 50)
    } else {
      setFeedback2("もう一度考えてみよう。スイッチ間を接続するポートはどれでしょうか？ 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-4xl font-bold mb-8">VLANチャレンジ</h1>
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <p className="mb-4">
          ネットワーク管理者として、新しいVLANを設定し、特定のポートを割り当てる必要があります。 VLAN
          ID（1-4094）とポート番号（1-48、カンマ区切り）を入力してください。
        </p>
        <div className="flex space-x-2 mb-4">
          <Input
            type="number"
            placeholder="VLAN ID"
            value={vlanId}
            onChange={(e) => setVlanId(e.target.value)}
            min="1"
            max="4094"
            className="text-black placeholder-gray-500"
          />
          <Input
            type="text"
            placeholder="ポート番号（例: 1,2,3）"
            value={portNumbers}
            onChange={(e) => setPortNumbers(e.target.value)}
            className="text-black placeholder-gray-500"
          />
          <Button onClick={checkVLAN}>チェック</Button>
        </div>
        {feedback && (
          <p className={`mb-4 ${feedback.includes("正しい") ? "text-green-600" : "text-red-600"}`}>{feedback}</p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">2つのスイッチを接続するトランクポートの番号は何番でしょうか？</p>
          <RadioGroup value={trunkPort} onValueChange={setTrunkPort}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="r1" />
              <Label htmlFor="r1">ポート1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="24" id="r2" />
              <Label htmlFor="r2">ポート24</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="49" id="r3" />
              <Label htmlFor="r3">ポート49</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkTrunkPort} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-600" : "text-red-600"}`}>
            {feedback2}
          </p>
        )}

        <Progress value={progress} className="mt-4 mb-2" />
        <p className="text-sm text-gray-600">進捗: {progress}% 完了</p>

        <Button onClick={toggleHint} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          {showHint ? "ヒントを隠す 🙈" : "ヒントを見る 💡"}
        </Button>

        {showHint && (
          <div className="mt-4 bg-blue-100 p-4 rounded-lg">
            <p className="text-base text-blue-800">
              <strong>ヒント:</strong> VLANの設定では、適切なVLAN IDとそれに属するポートを指定する必要があります。
              トランクポートは通常、スイッチの高速ポートを使用し、複数のVLANのトラフィックを伝送します。
              多くのスイッチでは、ポート49以降が高速ポートとして使用されることがあります。
            </p>
          </div>
        )}
      </div>
      <Button asChild className="mt-8">
        <Link href="/challenge">チャレンジモードに戻る</Link>
      </Button>
    </div>
  )
}


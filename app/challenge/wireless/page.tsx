"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function WirelessChallengePage() {
  const [ssid, setSSID] = useState("")
  const [password, setPassword] = useState("")
  const [channel, setChannel] = useState("")
  const [security, setSecurity] = useState("")
  const [frequency, setFrequency] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkWireless = () => {
    const channelValue = Number.parseInt(channel)

    if (
      ssid.length > 0 &&
      password.length >= 8 &&
      !isNaN(channelValue) &&
      channelValue >= 1 &&
      channelValue <= 14 &&
      security !== ""
    ) {
      setFeedback("正しい無線LAN設定です！")
      setProgress(50)
    } else {
      const errorMessage = []
      if (ssid.length === 0) errorMessage.push("SSIDを入力してください")
      if (password.length < 8) errorMessage.push("パスワードは8文字以上である必要があります")
      if (isNaN(channelValue) || channelValue < 1 || channelValue > 14)
        errorMessage.push("チャンネルは1から14の範囲内である必要があります")
      if (security === "") errorMessage.push("セキュリティタイプを選択してください")

      setFeedback(errorMessage.join(", "))
      setProgress(25)
    }
  }

  const checkFrequency = () => {
    if (frequency === "5") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => prev + 50)
    } else {
      setFeedback2("もう一度考えてみよう。より高速な通信が可能な周波数帯はどちらでしょうか？ 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-4xl font-bold mb-8">無線LANチャレンジ</h1>
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <p className="mb-4">
          ネットワーク管理者として、新しい無線LANを設定する必要があります。
          SSID、パスワード、チャンネル、およびセキュリティタイプを設定してください。
        </p>
        <div className="flex flex-col space-y-2 mb-4">
          <Input
            type="text"
            placeholder="SSID"
            value={ssid}
            onChange={(e) => setSSID(e.target.value)}
            className="text-black placeholder-gray-500"
          />
          <Input
            type="password"
            placeholder="パスワード（8文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-black placeholder-gray-500"
          />
          <Input
            type="number"
            placeholder="チャンネル（1-14）"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            min="1"
            max="14"
            className="text-black placeholder-gray-500"
          />
          <Select onValueChange={setSecurity}>
            <SelectTrigger className="text-black">
              <SelectValue placeholder="セキュリティタイプ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wep">WEP</SelectItem>
              <SelectItem value="wpa">WPA</SelectItem>
              <SelectItem value="wpa2">WPA2</SelectItem>
              <SelectItem value="wpa3">WPA3</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={checkWireless}>チェック</Button>
        </div>
        {feedback && (
          <p className={`mb-4 ${feedback.includes("正しい") ? "text-green-600" : "text-red-600"}`}>{feedback}</p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">より高速な通信が可能な周波数帯はどちらでしょうか？</p>
          <RadioGroup value={frequency} onValueChange={setFrequency}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2.4" id="r1" />
              <Label htmlFor="r1">2.4 GHz</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="5" id="r2" />
              <Label htmlFor="r2">5 GHz</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkFrequency} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong> 無線LANの設定では、一意のSSIDと強力なパスワードが重要です。
              チャンネルは混信を避けるために適切に選択する必要があります。
              セキュリティタイプは、最新のものほど安全性が高くなります。
              周波数帯については、高い周波数帯のほうが一般的に高速な通信が可能ですが、
              壁などの障害物の影響を受けやすいという特徴があります。
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


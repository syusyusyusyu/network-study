"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

export default function StaticRoutingLearnPage() {
  const [destination, setDestination] = useState("")
  const [nextHop, setNextHop] = useState("")
  const [feedback, setFeedback] = useState("")
  const [progress, setProgress] = useState(0)

  const checkRouting = () => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipPattern.test(destination) && ipPattern.test(nextHop)) {
      setFeedback("正しいルーティング設定です！")
      setProgress(100)
    } else {
      setFeedback("宛先ネットワークとネクストホップの両方を正しいIPアドレス形式で入力してください。")
      setProgress(50)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-4xl font-bold mb-8">スタティックルーティングを学ぼう</h1>
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <p className="mb-4">
          スタティックルーティングは、ネットワーク管理者が手動で設定するルーティング方法です。
          宛先ネットワークとネクストホップ（次のルーター）を指定することで、パケットの経路を制御します。
        </p>
        <p className="mb-4">例: 宛先ネットワーク: 192.168.2.0/24, ネクストホップ: 10.0.0.1</p>
        <div className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="宛先ネットワーク"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <Input
            type="text"
            placeholder="ネクストホップ"
            value={nextHop}
            onChange={(e) => setNextHop(e.target.value)}
          />
          <Button onClick={checkRouting}>チェック</Button>
        </div>
        {feedback && (
          <p className={`mb-4 ${feedback.includes("正しい") ? "text-green-600" : "text-red-600"}`}>{feedback}</p>
        )}
        <Progress value={progress} className="mb-4" />
        <p className="text-sm text-gray-600">進捗: {progress}% 完了</p>
      </div>
      <Button asChild className="mt-8">
        <Link href="/learn">学習モードに戻る</Link>
      </Button>
    </div>
  )
}


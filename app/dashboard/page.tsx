"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  const [progress, setProgress] = useState({
    basic: 0,
    ipAddress: 0,
    routing: 0,
    vlan: 0,
    wireless: 0,
  })

  useEffect(() => {
    // ここで、ローカルストレージまたはバックエンドAPIから進捗データを取得します
    // この例では、ランダムな進捗を生成しています
    setProgress({
      basic: Math.floor(Math.random() * 101),
      ipAddress: Math.floor(Math.random() * 101),
      routing: Math.floor(Math.random() * 101),
      vlan: Math.floor(Math.random() * 101),
      wireless: Math.floor(Math.random() * 101),
    })
  }, [])

  const totalProgress = Object.values(progress).reduce((a, b) => a + b, 0) / 4

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-4xl font-bold mb-8">ダッシュボード</h1>
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">全体の進捗</h2>
        <Progress value={totalProgress} className="mb-4" />
        <p className="text-lg mb-6">総合スコア: {totalProgress.toFixed(2)}%</p>

        <h3 className="text-xl font-bold mb-2">トピック別進捗</h3>
        <div className="space-y-4">
        <div>
            <p>ネットワーク基礎</p>
            <Progress value={progress.ipAddress} className="mb-2" />
            <p className="text-sm">{progress.ipAddress}% 完了</p>
          </div>
          <div>
            <p>IPアドレス</p>
            <Progress value={progress.ipAddress} className="mb-2" />
            <p className="text-sm">{progress.ipAddress}% 完了</p>
          </div>
          <div>
            <p>ルーティング</p>
            <Progress value={progress.routing} className="mb-2" />
            <p className="text-sm">{progress.routing}% 完了</p>
          </div>
          <div>
            <p>VLAN</p>
            <Progress value={progress.vlan} className="mb-2" />
            <p className="text-sm">{progress.vlan}% 完了</p>
          </div>
          <div>
            <p>無線LAN</p>
            <Progress value={progress.wireless} className="mb-2" />
            <p className="text-sm">{progress.wireless}% 完了</p>
          </div>
        </div>
      </div>
      <div className="mt-8 space-x-4">
        <Button asChild>
          <Link href="/learn">学習を続ける</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/challenge">チャレンジに挑戦</Link>
        </Button>
      </div>
    </div>
  )
}


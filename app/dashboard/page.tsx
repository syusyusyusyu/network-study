"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
// db関連のインポート（resetProgressを追加）
import { getProgress, resetProgress, ProgressData } from "../utils/db"
// Dialog関連のコンポーネントをインポート
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import confetti from 'canvas-confetti'

export default function DashboardPage() {
  // 初期値を0に設定
  const [progress, setProgress] = useState<ProgressData>({
    id: 'progress',
    basic: 0,
    ipAddress: 0,
    routing: 0,
    vlan: 0,
    wireless: 0
  })
  
  // ローディング状態を追加
  const [isLoading, setIsLoading] = useState(true)
  // エラー状態を追加
  const [error, setError] = useState<string | null>(null)
  // リセット中の状態
  const [isResetting, setIsResetting] = useState(false)
  // リセット確認ダイアログの状態
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  // コンプリート演出表示の状態
  const [showCompletion, setShowCompletion] = useState(false)
  // コンプリート確認済みフラグ（演出を一度だけ表示するため）
  const [hasTriggeredCompletion, setHasTriggeredCompletion] = useState(false)

  // 進捗データを取得する関数
  const fetchProgress = async () => {
    try {
      setIsLoading(true)
      const data = await getProgress()
      setProgress(data)
      
      // 全ての進捗が100%か確認
      const isComplete = 
        data.basic === 100 && 
        data.ipAddress === 100 && 
        data.routing === 100 && 
        data.vlan === 100 && 
        data.wireless === 100
      
      // 初めて100%達成した時だけお祝い演出を表示
      if (isComplete && !hasTriggeredCompletion) {
        setShowCompletion(true)
        setHasTriggeredCompletion(true)
        
        // confetti効果を実行
        setTimeout(() => {
          triggerConfetti()
        }, 300)
      }
    } catch (err) {
      console.error('進捗データの取得に失敗しました', err)
      setError('データの読み込みに失敗しました。ページを再読み込みしてください。')
    } finally {
      setIsLoading(false)
    }
  }

  // confetti効果を実行する関数
  const triggerConfetti = () => {
    if (typeof window !== 'undefined') {
      const duration = 5000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }
      
      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()
        
        if (timeLeft <= 0) {
          return clearInterval(interval)
        }
        
        const particleCount = 50 * (timeLeft / duration)
        
        // 画面の左側から紙吹雪
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        
        // 画面の右側から紙吹雪
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)
    }
  }

  // コンプリート演出を閉じる
  const closeCompletion = () => {
    setShowCompletion(false)
  }

  useEffect(() => {
    // IndexedDBから進捗データを取得
    fetchProgress()
  }, [])

  // 進捗データをリセットする関数
  const handleReset = async () => {
    try {
      setIsResetting(true)
      await resetProgress()
      setHasTriggeredCompletion(false) // リセット時にフラグもリセット
      await fetchProgress() // データをリセット後に再取得
      setResetDialogOpen(false) // ダイアログを閉じる
    } catch (err) {
      console.error('進捗データのリセットに失敗しました', err)
      setError('データのリセットに失敗しました。')
    } finally {
      setIsResetting(false)
    }
  }

  // 各セクションの平均値を計算
  const totalProgress = (
    progress.basic + 
    progress.ipAddress + 
    progress.routing + 
    progress.vlan + 
    progress.wireless
  ) / 5

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-4xl font-bold mb-8">ダッシュボード</h1>
      
      {isLoading ? (
        <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-2xl w-full text-center">
          <p>データを読み込んでいます...</p>
        </div>
      ) : error ? (
        <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-2xl w-full text-center">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </div>
      ) : (
        <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">全体の進捗</h2>
            
            {/* リセットボタンとダイアログ */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  データリセット
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>進捗データのリセット</DialogTitle>
                  <DialogDescription>
                    全ての学習進捗データが0にリセットされます。この操作は元に戻せません。
                    続行しますか？
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReset}
                    disabled={isResetting}
                  >
                    {isResetting ? "リセット中..." : "リセットする"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Progress value={totalProgress} className="mb-4" />
          <p className="text-lg mb-6">総合スコア: {totalProgress.toFixed(2)}%</p>

          <h3 className="text-xl font-bold mb-2">トピック別進捗</h3>
          <div className="space-y-4">
            <div>
              <p>ネットワーク基礎</p>
              <Progress value={progress.basic} className="mb-2" />
              <p className="text-sm">{progress.basic.toFixed(2)}% 完了</p>
            </div>
            <div>
              <p>IPアドレス</p>
              <Progress value={progress.ipAddress} className="mb-2" />
              <p className="text-sm">{progress.ipAddress.toFixed(2)}% 完了</p>
            </div>
            <div>
              <p>ルーティング</p>
              <Progress value={progress.routing} className="mb-2" />
              <p className="text-sm">{progress.routing.toFixed(2)}% 完了</p>
            </div>
            <div>
              <p>VLAN</p>
              <Progress value={progress.vlan} className="mb-2" />
              <p className="text-sm">{progress.vlan.toFixed(2)}% 完了</p>
            </div>
            <div>
              <p>無線LAN</p>
              <Progress value={progress.wireless} className="mb-2" />
              <p className="text-sm">{progress.wireless.toFixed(2)}% 完了</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 space-x-4">
        <Button asChild variant="secondary">
          <Link href="/">トップメニューに戻る</Link>
        </Button>
      </div>

      {/* コンプリート演出のモーダル */}
      {showCompletion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-lg shadow-2xl text-center max-w-md animate-bounce-slow">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">おめでとうございます！</h2>
            <p className="text-2xl text-white mb-6">
              全てのネットワーク学習コースを修了しました！🎉
            </p>
            <Button 
              onClick={closeCompletion}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg px-8 py-4"
            >
              閉じる
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
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

  // 進捗データを取得する関数
  const fetchProgress = async () => {
    try {
      setIsLoading(true)
      const data = await getProgress()
      setProgress(data)
    } catch (err) {
      console.error('進捗データの取得に失敗しました', err)
      setError('データの読み込みに失敗しました。ページを再読み込みしてください。')
    } finally {
      setIsLoading(false)
    }
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
    </div>
  )
}
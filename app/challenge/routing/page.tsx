"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { saveProgress, getProgress } from "../../utils/db"

const devices = [
  { type: "router" as const, x: 200, y: 50, label: "R1", ip: "10.0.0.1" },
  { type: "router" as const, x: 400, y: 50, label: "R2", ip: "10.0.0.2" },
  { type: "pc" as const, x: 100, y: 150, label: "PC1", ip: "192.168.1.2" },
  { type: "server" as const, x: 500, y: 150, label: "Server", ip: "192.168.2.2" },
]

const connections = [
  { from: 0, to: 1, label: "Gi0/0/0" },
  { from: 0, to: 2, label: "Gi0/0" },
  { from: 1, to: 3, label: "Gi0/0" },
]

export default function RoutingChallengePage() {
  const [nextHop, setNextHop] = useState("")
  const [routeNetwork, setRouteNetwork] = useState("")
  const [routeCommand, setRouteCommand] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    nextHop: false,
    routeNetwork: false,
    routeCommand: false
  })

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        // IndexedDBから進捗データを取得
        const progressData = await getProgress();
        
        // 全体の進捗を取得
        const totalProgress = progressData.routing || 0;
        
        // チャレンジページ内での進捗を計算 (100%満点)
        // チャレンジページは全体の後半50%を担当するので
        const challengeLocalProgress = Math.min(100, Math.max(0, (totalProgress - 50) * 2));
        setProgress(challengeLocalProgress);
        
        // 正解状態を更新
        if (challengeLocalProgress > 0) {
          const questionLocalValue = 100 / 3; // 各問題が33.33%ずつ
          setCorrectAnswers({
            nextHop: challengeLocalProgress >= questionLocalValue,
            routeNetwork: challengeLocalProgress >= questionLocalValue * 2,
            routeCommand: challengeLocalProgress >= questionLocalValue * 3,
          });
        }
      } catch (error) {
        console.error('進捗データの取得に失敗しました:', error);
      }
    };
    
    fetchSavedProgress();
  }, []);

  // 正解状態が変わったときに進捗を更新
  useEffect(() => {
    const updateProgress = async () => {
      try {
        // チャレンジページでの正解数を計算
        const correctCount = Object.values(correctAnswers).filter(Boolean).length;
        const totalCountInChallenge = Object.keys(correctAnswers).length;
        
        // ローカルの進捗状態を更新（チャレンジページ内での進捗 - 100%満点）
        const localProgress = Math.round((correctCount / totalCountInChallenge) * 100);
        setProgress(localProgress);
        
        // 現在の進捗データを取得
        const progressData = await getProgress();
        
        // 学習ページの進捗を保持 (0-50%)
        const learnPartProgress = Math.min(progressData.routing || 0, 50);
        
        // チャレンジページの貢献分を計算 (0-50%)
        const challengePartProgress = Math.round((correctCount / totalCountInChallenge) * 50);
        
        // 合計進捗を計算
        const newTotalProgress = Math.min(learnPartProgress + challengePartProgress, 100);
        
        // IndexedDBに保存
        await saveProgress('routing', newTotalProgress);
      } catch (error) {
        console.error('進捗の保存に失敗しました:', error);
      }
    };
    
    // 初期レンダリング時に実行しないためのガード条件
    if (!Object.values(correctAnswers).every(value => value === false)) {
      updateProgress();
    }
  }, [correctAnswers]);

  const checkNextHop = () => {
    if (nextHop.trim() === "10.0.0.2") {
      setFeedback("正解です！素晴らしい設定です！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, nextHop: true }));
    } else {
      setFeedback("惜しい！もう一度確認してみよう。R2のIPアドレスを確認してください。 🤔")
      setCorrectAnswers(prev => ({ ...prev, nextHop: false }));
    }
  }

  const checkRouteNetwork = () => {
    if (routeNetwork === "192.168.2.0") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, routeNetwork: true }));
    } else {
      setFeedback2("もう一度考えてみよう。Serverが属するネットワークアドレスを確認してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, routeNetwork: false }));
    }
  }

  const checkRouteCommand = () => {
    const correctCommand = "ip route 192.168.2.0 255.255.255.0 10.0.0.2"
    if (routeCommand.trim().toLowerCase() === correctCommand.toLowerCase()) {
      setFeedback3("正解です！完璧なコマンドです！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, routeCommand: true }));
    } else {
      setFeedback3("惜しい！もう一度確認してみよう。コマンドの形式と必要な情報を見直してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, routeCommand: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="スタティックルーティングチャレンジ" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          2つのネットワークを接続するスタティックルーティング設定を行います。以下の質問に答えてください：
        </p>

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">
            1.
            R1からServerへのスタティックルートを設定する場合、次のホップ（ネクストホップ）のIPアドレスは何になりますか？
          </p>
          <Input
            type="text"
            placeholder="次のホップのIPアドレスを入力"
            value={nextHop}
            onChange={(e) => setNextHop(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkNextHop} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback && (
          <p className={`mt-4 text-lg ${feedback.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">
            2. R1に設定するスタティックルートの宛先ネットワークアドレスは何になりますか？
          </p>
          <Input
            type="text"
            placeholder="宛先ネットワークアドレスを入力"
            value={routeNetwork}
            onChange={(e) => setRouteNetwork(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkRouteNetwork} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">
            3. R1にスタティックルートを設定するコマンドを入力してください。 （ヒント：ip route [宛先ネットワーク]
            [サブネットマスク] [ネクストホップ]）
          </p>
          <Textarea
            placeholder="ルーティングコマンドを入力"
            value={routeCommand}
            onChange={(e) => setRouteCommand(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkRouteCommand} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong> スタティックルートの設定には、宛先ネットワークとネクストホップの情報が必要です。
              ネクストホップは、直接接続されているルーターのIPアドレスになります。
              宛先ネットワークは、到達したいネットワークのアドレスです。 コマンドの形式は "ip route [宛先ネットワーク]
              [サブネットマスク] [ネクストホップ]" です。
              サブネットマスクは通常のクラスCネットワークを想定してください。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
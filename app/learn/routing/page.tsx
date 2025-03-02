"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { saveProgress, getProgress } from "../../utils/db"

const devices = [
  { type: "router" as const, x: 150, y: 80, label: "ルータA", ip: "192.168.1.1" },
  { type: "router" as const, x: 450, y: 80, label: "ルータB", ip: "192.168.2.1" },
  { type: "pc" as const, x: 150, y: 200, label: "PC1", ip: "192.168.1.10" },
  { type: "server" as const, x: 450, y: 200, label: "サーバ", ip: "192.168.2.10" },
]

const connections = [
  { from: 0, to: 1, label: "WAN" },
  { from: 0, to: 2, label: "LAN" },
  { from: 1, to: 3, label: "LAN" },
]

export default function RoutingLearnPage() {
  const [routeDefinition, setRouteDefinition] = useState("")
  const [routeBenefit, setRouteBenefit] = useState("")
  const [routeCommand, setRouteCommand] = useState("")
  const [feedback1, setFeedback1] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)
  
  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    routeDefinition: false,
    routeBenefit: false,
    routeCommand: false
  })

  // 進捗状態を更新する関数
  const updateProgress = async () => {
    try {
      // 正解数を計算
      const correctCount = Object.values(correctAnswers).filter(Boolean).length;
      const totalQuestions = Object.keys(correctAnswers).length;
      
      // 進捗率を計算（0-100%）
      const newProgress = Math.round((correctCount / totalQuestions) * 100);
      setProgress(newProgress);
      
      // 学習パートは全体の50%を占めるので、保存する進捗値は半分（0-50%の範囲）
      const progressToSave = Math.round(newProgress / 2);
      await saveProgress('routing', progressToSave);
      
    } catch (error) {
      console.error('進捗の保存に失敗しました:', error);
    }
  };

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        const progressData = await getProgress();
        const savedProgress = progressData.routing || 0;
        
        // 保存された進捗が0-50%の範囲なので、表示用に倍にする（0-100%の範囲に）
        const displayProgress = Math.min(100, savedProgress * 2);
        setProgress(displayProgress);
        
        // 保存された進捗に応じて正解状態を設定
        if (displayProgress > 0) {
          const questionValue = 100 / 3; // 各問題の価値（33.33%）
          setCorrectAnswers({
            routeDefinition: displayProgress >= questionValue,
            routeBenefit: displayProgress >= questionValue * 2,
            routeCommand: displayProgress >= questionValue * 3
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
    if (!Object.values(correctAnswers).every(value => value === false)) {
      updateProgress();
    }
  }, [correctAnswers]);

  const checkRouteDefinition = () => {
    if (routeDefinition === "b") {
      setFeedback1("正解です！素晴らしい！ルーティングはパケットの経路決定を行うプロセスです。 🎉")
      setCorrectAnswers(prev => ({ ...prev, routeDefinition: true }));
    } else {
      setFeedback1("もう一度考えてみよう。ルーティングの基本的な役割を考えましょう。 💪")
      setCorrectAnswers(prev => ({ ...prev, routeDefinition: false }));
    }
  }

  const checkRouteBenefit = () => {
    if (routeBenefit === "a") {
      setFeedback2("正解です！素晴らしい！スタティックルートは管理者が手動で設定するため、トラフィックの予測可能性が高まります。 🎉")
      setCorrectAnswers(prev => ({ ...prev, routeBenefit: true }));
    } else {
      setFeedback2("もう一度考えてみよう。スタティックルーティングの利点を考えましょう。 💪")
      setCorrectAnswers(prev => ({ ...prev, routeBenefit: false }));
    }
  }

  const checkRouteCommand = () => {
    if (routeCommand === "a") {
      setFeedback3("正解です！素晴らしい！サーバーのネットワークへの正しいルート設定です！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, routeCommand: true }));
    } else {
      setFeedback3("もう一度考えてみよう。図を見て、どのネットワークに向けてルートを設定するべきかを確認しましょう。 💪")
      setCorrectAnswers(prev => ({ ...prev, routeCommand: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="ルーティングの基礎" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="mt-6 space-y-4">
          <p className="text-lg">
            ルーティングは、ネットワーク間でデータパケットを転送するための経路を決定するプロセスです。
            上の図では、ルータAとルータBが接続されており、それぞれ異なるネットワークを持っています。
            PC1からサーバにデータを送るには、ルーティングが必要です。
          </p>

          <div className="mt-6 space-y-4">
            <p className="text-lg font-semibold">1. ルーティングの定義として最も適切なものを選んでください：</p>
            <RadioGroup value={routeDefinition} onValueChange={setRouteDefinition}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r1" />
                <Label htmlFor="r1">デバイスにIPアドレスを割り当てるプロセス</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r2" />
                <Label htmlFor="r2">パケットがネットワーク間を移動する経路を決定するプロセス</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r3" />
                <Label htmlFor="r3">デバイス間の物理的な配線を行うプロセス</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkRouteDefinition} className="bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
          </div>

          {feedback1 && (
            <p className={`mt-4 text-lg ${feedback1.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
              {feedback1}
            </p>
          )}

          <div className="mt-6 space-y-4">
            <p className="text-lg font-semibold">2. スタティックルーティングの主な利点は何ですか？</p>
            <RadioGroup value={routeBenefit} onValueChange={setRouteBenefit}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="rb1" />
                <Label htmlFor="rb1">設定が簡単でトラフィックの流れが予測しやすい</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="rb2" />
                <Label htmlFor="rb2">ネットワーク構成が変わっても自動的に経路を更新する</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="rb3" />
                <Label htmlFor="rb3">複雑なアルゴリズムで常に最短経路を見つける</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkRouteBenefit} className="bg-green-500 hover:bg-green-600 text-white">
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
              3. PC1からサーバーに通信するために必要なルート設定はどれですか？
            </p>
            <RadioGroup value={routeCommand} onValueChange={setRouteCommand}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="rc1" />
                <Label htmlFor="rc1">
                  <span className="font-semibold">ルータAで設定</span>：サーバーのネットワーク(192.168.2.0)へのルート
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="rc2" />
                <Label htmlFor="rc2">
                  <span className="font-semibold">ルータBで設定</span>：PC1のネットワーク(192.168.1.0)へのルート
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="rc3" />
                <Label htmlFor="rc3">
                  <span className="font-semibold">ルータAで設定</span>：サーバー自身(192.168.2.10)へのルート
                </Label>
              </div>
            </RadioGroup>
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
          <p className="text-base md:text-lg text-gray-200 mb-4">進捗: {progress.toFixed(0)}% 🚀</p>

          <Button onClick={toggleHint} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
            {showHint ? "ヒントを隠す 🙈" : "ヒントを見る 💡"}
          </Button>

          {showHint && (
            <div className="mt-4 bg-blue-100 bg-opacity-20 p-4 rounded-lg">
              <p className="text-base md:text-lg text-white">
                <strong>ヒント:</strong><br/>
                1. ルーティングの主な目的は、パケットがある場所から別の場所へ移動する際の道筋を決めることです。<br/>
                2. スタティックルーティングは管理者が手動で設定する方法で、設定が簡単なのが特徴です。<br/>
                3. ルートを設定する際は、「どのネットワークに向けて」「どのルーターを経由するか」を考えましょう。
                図を見ると、PC1はルータAに繋がっており、サーバーはルータBに繋がっていることが分かります。
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
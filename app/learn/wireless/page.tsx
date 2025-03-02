"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Layout } from "@/components/Layout"
import { saveProgress, getProgress } from "../../utils/db"

export default function WirelessLearnPage() {
  const [wifiDefinition, setWifiDefinition] = useState("")
  const [securityType, setSecurityType] = useState("")
  const [frequencyBand, setFrequencyBand] = useState("")
  const [feedback1, setFeedback1] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)
  
  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    wifiDefinition: false,
    securityType: false,
    frequencyBand: false
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
      await saveProgress('wireless', progressToSave);
      
    } catch (error) {
      console.error('進捗の保存に失敗しました:', error);
    }
  };

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        const progressData = await getProgress();
        const savedProgress = progressData.wireless || 0;
        
        // 保存された進捗が0-50%の範囲なので、表示用に倍にする（0-100%の範囲に）
        const displayProgress = Math.min(100, savedProgress * 2);
        setProgress(displayProgress);
        
        // 保存された進捗に応じて正解状態を設定
        if (displayProgress > 0) {
          const questionValue = 100 / 3; // 各問題の価値（33.33%）
          setCorrectAnswers({
            wifiDefinition: displayProgress >= questionValue,
            securityType: displayProgress >= questionValue * 2,
            frequencyBand: displayProgress >= questionValue * 3
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

  const checkWifiDefinition = () => {
    if (wifiDefinition === "b") {
      setFeedback1("正解です！素晴らしい！無線LANは、電波を使用してデバイスをネットワークに接続する技術です。 🎉")
      setCorrectAnswers(prev => ({ ...prev, wifiDefinition: true }));
    } else {
      setFeedback1("もう一度考えてみよう。無線LANの基本的な定義を思い出してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, wifiDefinition: false }));
    }
  }

  const checkSecurityType = () => {
    if (securityType === "c") {
      setFeedback2("正解です！素晴らしい！WPA3は最新かつ最も安全なセキュリティプロトコルです。 🎉")
      setCorrectAnswers(prev => ({ ...prev, securityType: true }));
    } else {
      setFeedback2("もう一度考えてみよう。最新の無線LANセキュリティプロトコルはどれでしょうか？ 💪")
      setCorrectAnswers(prev => ({ ...prev, securityType: false }));
    }
  }

  const checkFrequencyBand = () => {
    if (frequencyBand === "a") {
      setFeedback3("正解です！素晴らしい！2.4GHzは壁などの障害物を通過しやすい特性があります。 🎉")
      setCorrectAnswers(prev => ({ ...prev, frequencyBand: true }));
    } else {
      setFeedback3("もう一度考えてみよう。障害物に強い周波数帯はどちらでしょうか？ 💪")
      setCorrectAnswers(prev => ({ ...prev, frequencyBand: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="無線LANの基礎 📡" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <div className="mt-6 space-y-4">
          <p className="text-lg">
            無線LAN（Wi-Fi）は現代のネットワークにおいて欠かせない技術です。
            有線接続なしでデバイスをインターネットに接続できる便利さから、家庭やオフィス、公共施設など様々な場所で利用されています。
          </p>

          <div className="mt-6 space-y-4">
            <p className="text-lg font-semibold">1. 無線LANの定義として最も適切なものを選んでください：</p>
            <RadioGroup value={wifiDefinition} onValueChange={setWifiDefinition}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r1" />
                <Label htmlFor="r1">インターネットに直接接続するための技術</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r2" />
                <Label htmlFor="r2">電波を使ってデバイスをネットワークに接続する技術</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r3" />
                <Label htmlFor="r3">光ファイバーを使ったワイヤレス接続技術</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkWifiDefinition} className="bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
          </div>

          {feedback1 && (
            <p className={`mt-4 text-lg ${feedback1.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
              {feedback1}
            </p>
          )}

          <div className="mt-6 space-y-4">
            <p className="text-lg font-semibold">2. 最も安全な無線LANのセキュリティプロトコルはどれですか？</p>
            <RadioGroup value={securityType} onValueChange={setSecurityType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="st1" />
                <Label htmlFor="st1">WEP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="st2" />
                <Label htmlFor="st2">WPA</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="st3" />
                <Label htmlFor="st3">WPA3</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="d" id="st4" />
                <Label htmlFor="st4">WPA2</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkSecurityType} className="bg-green-500 hover:bg-green-600 text-white">
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
              3. 壁などの障害物を通過しやすい無線LAN周波数帯はどちらですか？
            </p>
            <RadioGroup value={frequencyBand} onValueChange={setFrequencyBand}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="fb1" />
                <Label htmlFor="fb1">2.4 GHz</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="fb2" />
                <Label htmlFor="fb2">5 GHz</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkFrequencyBand} className="bg-green-500 hover:bg-green-600 text-white">
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
                <strong>ヒント:</strong> 無線LANは、電波を使用して有線接続なしでネットワークアクセスを提供する技術です。
                セキュリティプロトコルは、古い順にWEP、WPA、WPA2、WPA3と進化してきました。
                周波数帯は主に2.4GHzと5GHzがあり、それぞれ特性が異なります。
                2.4GHzは障害物を通過しやすく広い範囲をカバーできますが、混雑しやすいという特徴があります。
                5GHzはより高速ですが、障害物に弱く到達距離が短くなります。
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
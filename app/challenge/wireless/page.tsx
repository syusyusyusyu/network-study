"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Layout } from "@/components/Layout"
import { saveProgress, getProgress } from "../../utils/db"

export default function WirelessChallengePage() {
  const [ssid, setSSID] = useState("")
  const [password, setPassword] = useState("")
  const [channel, setChannel] = useState("")
  const [security, setSecurity] = useState("")
  const [frequency, setFrequency] = useState("")
  const [beaconInterval, setBeaconInterval] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)
  
  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    wirelessSetup: false,
    frequency: false,
    beaconInterval: false
  })

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        // IndexedDBから進捗データを取得
        const progressData = await getProgress();
        
        // 全体の進捗を取得
        const totalProgress = progressData.wireless || 0;
        
        // チャレンジページ内での進捗を計算 (100%満点)
        // チャレンジページは全体の後半50%を担当するので
        const challengeLocalProgress = Math.min(100, Math.max(0, (totalProgress - 50) * 2));
        setProgress(challengeLocalProgress);
        
        // 正解状態を更新
        if (challengeLocalProgress > 0) {
          const questionLocalValue = 100 / 3; // 各問題が33.33%ずつ
          setCorrectAnswers({
            wirelessSetup: challengeLocalProgress >= questionLocalValue,
            frequency: challengeLocalProgress >= questionLocalValue * 2,
            beaconInterval: challengeLocalProgress >= questionLocalValue * 3,
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
        const learnPartProgress = Math.min(progressData.wireless || 0, 50);
        
        // チャレンジページの貢献分を計算 (0-50%)
        const challengePartProgress = Math.round((correctCount / totalCountInChallenge) * 50);
        
        // 合計進捗を計算
        const newTotalProgress = Math.min(learnPartProgress + challengePartProgress, 100);
        
        // IndexedDBに保存
        await saveProgress('wireless', newTotalProgress);
      } catch (error) {
        console.error('進捗の保存に失敗しました:', error);
      }
    };
    
    // 初期レンダリング時に実行しないためのガード条件
    if (!Object.values(correctAnswers).every(value => value === false)) {
      updateProgress();
    }
  }, [correctAnswers]);

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
      setFeedback("正しい無線LAN設定です！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, wirelessSetup: true }));
    } else {
      const errorMessage = []
      if (ssid.length === 0) errorMessage.push("SSIDを入力してください")
      if (password.length < 8) errorMessage.push("パスワードは8文字以上である必要があります")
      if (isNaN(channelValue) || channelValue < 1 || channelValue > 14)
        errorMessage.push("チャンネルは1から14の範囲内である必要があります")
      if (security === "") errorMessage.push("セキュリティタイプを選択してください")

      setFeedback(errorMessage.join(", "))
      setCorrectAnswers(prev => ({ ...prev, wirelessSetup: false }));
    }
  }

  const checkFrequency = () => {
    if (frequency === "5") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, frequency: true }));
    } else {
      setFeedback2("もう一度考えてみよう。より高速な通信が可能な周波数帯はどちらでしょうか？ 💪")
      setCorrectAnswers(prev => ({ ...prev, frequency: false }));
    }
  }

  const checkBeaconInterval = () => {
    if (beaconInterval === "b") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, beaconInterval: true }));
    } else {
      setFeedback3("もう一度考えてみよう。一般的なビーコン間隔はどれくらいでしょうか？ 💪")
      setCorrectAnswers(prev => ({ ...prev, beaconInterval: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="無線LANチャレンジ 📡" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
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
            className="bg-white text-black placeholder-gray-500"
          />
          <Input
            type="password"
            placeholder="パスワード（8文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white text-black placeholder-gray-500"
          />
          <Input
            type="number"
            placeholder="チャンネル（1-14）"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            min="1"
            max="14"
            className="bg-white text-black placeholder-gray-500"
          />
          <Select onValueChange={setSecurity}>
            <SelectTrigger className="bg-white text-black">
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
          <p className={`mb-4 ${feedback.includes("正しい") ? "text-green-300" : "text-yellow-300"}`}>{feedback}</p>
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
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">一般的な無線LANのビーコン間隔はどれくらいですか？</p>
          <RadioGroup value={beaconInterval} onValueChange={setBeaconInterval}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="bi1" />
              <Label htmlFor="bi1">10ミリ秒</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="bi2" />
              <Label htmlFor="bi2">100ミリ秒</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="bi3" />
              <Label htmlFor="bi3">1000ミリ秒</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkBeaconInterval} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong> 無線LANの設定では、一意のSSIDと強力なパスワードが重要です。
              チャネルは混信を避けるために適切に選択する必要があります。
              セキュリティタイプは、最新のものほど安全性が高くなります。
              周波数帯については、高い周波数帯のほうが一般的に高速な通信が可能ですが、
              壁などの障害物の影響を受けやすいという特徴があります。
              ビーコン間隔は、アクセスポイントが自身の存在を周囲に知らせる頻度を示します。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
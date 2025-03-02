"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { saveProgress, getProgress } from "../../utils/db"

const devices = [
  { type: "switch" as const, x: 300, y: 50, label: "L3スイッチ" },
  { type: "switch" as const, x: 150, y: 150, label: "スイッチA" },
  { type: "switch" as const, x: 450, y: 150, label: "スイッチB" },
  { type: "pc" as const, x: 75, y: 250, label: "営業部PC", ip: "VLAN 10" },
  { type: "pc" as const, x: 225, y: 250, label: "経理部PC", ip: "VLAN 20" },
  { type: "pc" as const, x: 375, y: 250, label: "開発部PC", ip: "VLAN 30" },
  { type: "server" as const, x: 525, y: 250, label: "サーバ", ip: "VLAN 40" },
]

const connections = [
  { from: 0, to: 1, label: "Trunk" },
  { from: 0, to: 2, label: "Trunk" },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
  { from: 2, to: 6 },
]

export default function VLANChallengePage() {
  const [vlanId, setVlanId] = useState("")
  const [trunkConfig, setTrunkConfig] = useState("")
  const [accessPort, setAccessPort] = useState("")
  const [feedback1, setFeedback1] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    vlanId: false,
    trunkConfig: false,
    accessPort: false
  })

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        // IndexedDBから進捗データを取得
        const progressData = await getProgress();
        
        // 全体の進捗を取得
        const totalProgress = progressData.vlan || 0;
        
        // チャレンジページ内での進捗を計算 (100%満点)
        // チャレンジページは全体の後半50%を担当するので
        const challengeLocalProgress = Math.min(100, Math.max(0, (totalProgress - 50) * 2));
        setProgress(challengeLocalProgress);
        
        // 正解状態を更新
        if (challengeLocalProgress > 0) {
          const questionLocalValue = 100 / 3; // 各問題が33.33%ずつ
          setCorrectAnswers({
            vlanId: challengeLocalProgress >= questionLocalValue,
            trunkConfig: challengeLocalProgress >= questionLocalValue * 2,
            accessPort: challengeLocalProgress >= questionLocalValue * 3,
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
        const learnPartProgress = Math.min(progressData.vlan || 0, 50);
        
        // チャレンジページの貢献分を計算 (0-50%)
        const challengePartProgress = Math.round((correctCount / totalCountInChallenge) * 50);
        
        // 合計進捗を計算
        const newTotalProgress = Math.min(learnPartProgress + challengePartProgress, 100);
        
        // IndexedDBに保存
        await saveProgress('vlan', newTotalProgress);
      } catch (error) {
        console.error('進捗の保存に失敗しました:', error);
      }
    };
    
    // 初期レンダリング時に実行しないためのガード条件
    if (!Object.values(correctAnswers).every(value => value === false)) {
      updateProgress();
    }
  }, [correctAnswers]);

  const checkVlanId = () => {
    if (vlanId === "40") {
      setFeedback1("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, vlanId: true }));
    } else {
      setFeedback1("もう一度考えてみよう。サーバーが属するVLAN IDを確認してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, vlanId: false }));
    }
  }

  const checkTrunkConfig = () => {
    const correctConfig = "switchport mode trunk"
    if (trunkConfig.toLowerCase().includes(correctConfig)) {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, trunkConfig: true }));
    } else {
      setFeedback2("もう一度考えてみよう。トランクポートを設定するコマンドを思い出してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, trunkConfig: false }));
    }
  }

  const checkAccessPort = () => {
    if (accessPort === "c") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, accessPort: true }));
    } else {
      setFeedback3("もう一度考えてみよう。アクセスポートの役割を思い出してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, accessPort: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="VLANチャレンジ 🌐" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          上の図は、複数のVLANが設定されたネットワークを表しています。以下の質問に答えてください：
        </p>

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">1. サーバーが属するVLAN IDは何ですか？</p>
          <Input
            type="text"
            placeholder="VLAN IDを入力"
            value={vlanId}
            onChange={(e) => setVlanId(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkVlanId} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback1 && (
          <p className={`mt-4 text-lg ${feedback1.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback1}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">
            2. L3スイッチとスイッチA間のポートをトランクポートとして設定するコマンドは何ですか？
          </p>
          <Input
            type="text"
            placeholder="コマンドを入力"
            value={trunkConfig}
            onChange={(e) => setTrunkConfig(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkTrunkConfig} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">3. アクセスポートの役割は何ですか？</p>
          <RadioGroup value={accessPort} onValueChange={setAccessPort}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="a1" />
              <Label htmlFor="a1">複数のVLANのトラフィックを伝送する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="a2" />
              <Label htmlFor="a2">VLANを作成する</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="a3" />
              <Label htmlFor="a3">単一のVLANにデバイスを接続する</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkAccessPort} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong>
              <br />
              1. 図中のサーバーのラベルを確認してください。
              <br />
              2. トランクポートの設定には、特定のコマンドを使用します。通常は "switchport mode ..." の形式です。
              <br />
              3. アクセスポートは、エンドデバイス（PCやサーバーなど）を特定のVLANに接続するために使用されます。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
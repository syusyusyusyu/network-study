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
  { type: "switch" as const, x: 300, y: 100, label: "コアスイッチ" },
  { type: "pc" as const, x: 150, y: 200, label: "営業部PC", ip: "VLAN 10" },
  { type: "pc" as const, x: 300, y: 200, label: "技術部PC", ip: "VLAN 20" },
  { type: "server" as const, x: 450, y: 200, label: "サーバ", ip: "VLAN 30" },
]

const connections = [
  { from: 0, to: 1, label: "Fa0/1" },
  { from: 0, to: 2, label: "Fa0/2" },
  { from: 0, to: 3, label: "Fa0/3" },
]

export default function VLANLearnPage() {
  const [vlanDefinition, setVlanDefinition] = useState("")
  const [vlanBenefit, setVlanBenefit] = useState("")
  const [vlanCommand, setVlanCommand] = useState("")
  const [feedback1, setFeedback1] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)
  
  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    vlanDefinition: false,
    vlanBenefit: false,
    vlanCommand: false
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
      await saveProgress('vlan', progressToSave);
      
    } catch (error) {
      console.error('進捗の保存に失敗しました:', error);
    }
  };

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        const progressData = await getProgress();
        const savedProgress = progressData.vlan || 0;
        
        // 保存された進捗が0-50%の範囲なので、表示用に倍にする（0-100%の範囲に）
        const displayProgress = Math.min(100, savedProgress * 2);
        setProgress(displayProgress);
        
        // 保存された進捗に応じて正解状態を設定
        if (displayProgress > 0) {
          const questionValue = 100 / 3; // 各問題の価値（33.33%）
          setCorrectAnswers({
            vlanDefinition: displayProgress >= questionValue,
            vlanBenefit: displayProgress >= questionValue * 2,
            vlanCommand: displayProgress >= questionValue * 3
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

  const checkVlanDefinition = () => {
    if (vlanDefinition === "b") {
      setFeedback1("正解です！素晴らしい！VLANは物理的な制約なく、論理的にネットワークを分割します。 🎉")
      setCorrectAnswers(prev => ({ ...prev, vlanDefinition: true }));
    } else {
      setFeedback1("もう一度考えてみよう。VLANの基本的な定義を思い出してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, vlanDefinition: false }));
    }
  }

  const checkVlanBenefit = () => {
    if (vlanBenefit === "a") {
      setFeedback2("正解です！素晴らしい！VLANはブロードキャストドメインを制限し、セキュリティとパフォーマンスを向上します。 🎉")
      setCorrectAnswers(prev => ({ ...prev, vlanBenefit: true }));
    } else {
      setFeedback2("もう一度考えてみよう。VLANが提供する主なメリットを考えましょう。 💪")
      setCorrectAnswers(prev => ({ ...prev, vlanBenefit: false }));
    }
  }

  const checkVlanCommand = () => {
    const correctCommand = "vlan 50"
    if (vlanCommand.trim().toLowerCase() === correctCommand) {
      setFeedback3("正解です！完璧なコマンドです！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, vlanCommand: true }));
    } else {
      setFeedback3("惜しい！もう一度確認してみよう。VLANを作成するための最も基本的なコマンドを考えてください。 💪")
      setCorrectAnswers(prev => ({ ...prev, vlanCommand: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="VLANの基本 🌐" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="mt-6 space-y-4">
          <p className="text-lg">
            VLANは「Virtual Local Area Network（仮想ローカルエリアネットワーク）」の略で、
            物理的な接続に関わらず、論理的にネットワークを分割する技術です。
          </p>

          <div className="mt-6 space-y-4">
            <p className="text-lg font-semibold">1. VLANの正しい説明は次のうちどれですか？</p>
            <RadioGroup value={vlanDefinition} onValueChange={setVlanDefinition}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r1" />
                <Label htmlFor="r1">異なるネットワーク間でのルーティングを提供する技術</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r2" />
                <Label htmlFor="r2">単一の物理ネットワークを複数の論理ネットワークに分割する技術</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r3" />
                <Label htmlFor="r3">複数の物理ネットワークを単一の論理ネットワークに統合する技術</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkVlanDefinition} className="bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
          </div>

          {feedback1 && (
            <p className={`mt-4 text-lg ${feedback1.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
              {feedback1}
            </p>
          )}

          <div className="mt-6 space-y-4">
            <p className="text-lg font-semibold">2. VLANを使用する主な利点は何ですか？</p>
            <RadioGroup value={vlanBenefit} onValueChange={setVlanBenefit}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="rb1" />
                <Label htmlFor="rb1">ブロードキャストトラフィックの制限とセキュリティの向上</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="rb2" />
                <Label htmlFor="rb2">ネットワークの物理的な距離の拡張</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="rb3" />
                <Label htmlFor="rb3">インターネット接続速度の向上</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkVlanBenefit} className="bg-green-500 hover:bg-green-600 text-white">
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
              3. CiscoスイッチでVLAN 50を作成するための基本コマンドを入力してください：
            </p>
            <Input
              type="text"
              placeholder="コマンドを入力 (例: vlan [ID])"
              value={vlanCommand}
              onChange={(e) => setVlanCommand(e.target.value)}
              className="flex-1 bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkVlanCommand} className="bg-green-500 hover:bg-green-600 text-white">
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
                <strong>ヒント:</strong> VLANは物理的な構成に関係なく、ネットワークを論理的に分割するための技術です。
                これにより、セキュリティの向上、ブロードキャストドメインの制限、効率的なネットワーク管理が可能になります。
                Ciscoスイッチでは、グローバルコンフィギュレーションモードで「vlan」コマンドを使用してVLANを作成します。
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
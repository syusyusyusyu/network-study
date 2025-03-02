"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { saveProgress, getProgress } from "../../utils/db"

const devices = [
  { type: "router" as const, x: 300, y: 50, label: "R1", ip: "192.168.1.1" },
  { type: "switch" as const, x: 300, y: 150, label: "S1" },
  { type: "pc" as const, x: 150, y: 250, label: "PC1", ip: "192.168.1.10" },
  { type: "pc" as const, x: 300, y: 250, label: "PC2" },
  { type: "server" as const, x: 450, y: 250, label: "Server", ip: "192.168.1.100" },
]

const connections = [
  { from: 0, to: 1, label: "Gi0/0" },
  { from: 1, to: 2, label: "Fa0/1" },
  { from: 1, to: 3, label: "Fa0/2" },
  { from: 1, to: 4, label: "Fa0/3" },
]

export default function IPAddressChallengePage() {
  const [pc2IP, setPC2IP] = useState("")
  const [subnetMask, setSubnetMask] = useState("")
  const [defaultGateway, setDefaultGateway] = useState("")
  const [feedback1, setFeedback1] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)
  
  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    pc2IP: false,
    subnetMask: false,
    defaultGateway: false
  })

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        // IndexedDBから進捗データを取得
        const progressData = await getProgress();
        
        // 全体の進捗を取得
        const totalProgress = progressData.ipAddress || 0;
        
        // チャレンジページ内での進捗を計算 (100%満点)
        // チャレンジページは全体の後半50%を担当するので
        const challengeLocalProgress = Math.min(100, Math.max(0, (totalProgress - 50) * 2));
        setProgress(challengeLocalProgress);
        
        // 正解状態を更新
        if (challengeLocalProgress > 0) {
          const questionLocalValue = 100 / 3; // 各問題が33.33%ずつ
          setCorrectAnswers({
            pc2IP: challengeLocalProgress >= questionLocalValue,
            subnetMask: challengeLocalProgress >= questionLocalValue * 2,
            defaultGateway: challengeLocalProgress >= questionLocalValue * 3,
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
      // 初期レンダリング時は実行しない
      if (Object.values(correctAnswers).every(value => value === false)) return;
      
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
        const learnPartProgress = Math.min(progressData.ipAddress || 0, 50);
        
        // チャレンジページの貢献分を計算 (0-50%)
        const challengePartProgress = Math.round((correctCount / totalCountInChallenge) * 50);
        
        // 合計進捗を計算
        const newTotalProgress = Math.min(learnPartProgress + challengePartProgress, 100);
        
        // IndexedDBに保存
        await saveProgress('ipAddress', newTotalProgress);
      } catch (error) {
        console.error('進捗の保存に失敗しました:', error);
      }
    };
    
    updateProgress();
  }, [correctAnswers]);

  const checkPC2IP = () => {
    if (pc2IP === "192.168.1.11") {
      setFeedback1("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, pc2IP: true }));
    } else if (pc2IP.startsWith("192.168.1.")) {
      setFeedback1("惜しい！同じネットワーク内の未使用のIPアドレスを選んでください。 🤔")
      setCorrectAnswers(prev => ({ ...prev, pc2IP: false }));
    } else {
      setFeedback1("もう一度考えてみよう。他のデバイスのIPアドレスを参考にしてください。 💪")
      setCorrectAnswers(prev => ({ ...prev, pc2IP: false }));
    }
  }

  const checkSubnetMask = () => {
    if (subnetMask === "255.255.255.0") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, subnetMask: true }));
    } else {
      setFeedback2("もう一度考えてみよう。一般的なクラスCネットワークのサブネットマスクを思い出してください。 💪")
      setCorrectAnswers(prev => ({ ...prev, subnetMask: false }));
    }
  }

  const checkDefaultGateway = () => {
    if (defaultGateway === "192.168.1.1") {
      setFeedback3("正解です！完璧です！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, defaultGateway: true }));
    } else {
      setFeedback3("惜しい！もう一度考えてみよう。ルーターのIPアドレスが通常デフォルトゲートウェイになります。 💪")
      setCorrectAnswers(prev => ({ ...prev, defaultGateway: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="IPアドレス設定チャレンジ" backLink="/challenge" backText="チャレンジ一覧に戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <p className="mt-4 mb-2 text-lg font-semibold">
          ネットワーク管理者として、新しいPC（PC2）をネットワークに追加する必要があります。以下の質問に答えてください：
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold">1. PC2に割り当てるべき適切なIPアドレスは何ですか？</p>
            <Input
              type="text"
              placeholder="IPアドレスを入力"
              value={pc2IP}
              onChange={(e) => setPC2IP(e.target.value)}
              className="bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkPC2IP} className="mt-2 bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
            {feedback1 && (
              <p className={`mt-2 ${feedback1.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>{feedback1}</p>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold">2. このネットワークの適切なサブネットマスクは何ですか？</p>
            <Input
              type="text"
              placeholder="サブネットマスクを入力"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              className="bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkSubnetMask} className="mt-2 bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
            {feedback2 && (
              <p className={`mt-2 ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>{feedback2}</p>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold">
              3. PC2のデフォルトゲートウェイとして設定すべきIPアドレスは何ですか？
            </p>
            <Input
              type="text"
              placeholder="デフォルトゲートウェイを入力"
              value={defaultGateway}
              onChange={(e) => setDefaultGateway(e.target.value)}
              className="bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkDefaultGateway} className="mt-2 bg-green-500 hover:bg-green-600 text-white">
              チェック
            </Button>
            {feedback3 && (
              <p className={`mt-2 ${feedback3.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>{feedback3}</p>
            )}
          </div>
        </div>

        <Progress value={progress} className="mt-4 mb-2 h-3 md:h-4 rounded-full" />
        <p className="text-base md:text-lg text-gray-200 mb-4">進捗: {progress.toFixed(0)}% 🚀</p>

        <Button onClick={toggleHint} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          {showHint ? "ヒントを隠す 🙈" : "ヒントを見る 💡"}
        </Button>

        {showHint && (
          <div className="mt-4 bg-blue-100 bg-opacity-20 p-4 rounded-lg">
            <p className="text-base md:text-lg text-white">
              <strong>ヒント:</strong>
              <br />
              1. 新しいPCのIPアドレスは、同じネットワーク内の他のデバイスと競合しないようにしましょう。
              <br />
              2. クラスCネットワークの一般的なサブネットマスクを思い出してください。
              <br />
              3. デフォルトゲートウェイは通常、ローカルネットワーク内のルーターのIPアドレスです。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
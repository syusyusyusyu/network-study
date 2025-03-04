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
  { type: "router" as const, x: 300, y: 50, label: "ルータ", ip: "192.168.1.1" },
  { type: "pc" as const, x: 150, y: 150, label: "パソコン1", ip: "192.168.1.10" },
  { type: "pc" as const, x: 450, y: 150, label: "パソコン2", ip: "???" },
]

const connections = [
  { from: 0, to: 1, label: "LAN1" },
  { from: 0, to: 2, label: "LAN2" },
]

export default function IPAddressLearnPage() {
  const [ipAddress, setIpAddress] = useState("")
  const [subnetMask, setSubnetMask] = useState("")
  const [networkClass, setNetworkClass] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)
  
  // 正解状態を管理
  const [correctAnswers, setCorrectAnswers] = useState({
    ipAddress: false,
    subnetMask: false,
    networkClass: false
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
      await saveProgress('ipAddress', progressToSave);
      
    } catch (error) {
      console.error('進捗の保存に失敗しました:', error);
    }
  };

  // ページロード時に保存されている進捗データを取得
  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        const progressData = await getProgress();
        const savedProgress = progressData.ipAddress || 0;
        
        // 保存された進捗が0-50%の範囲なので、表示用に倍にする（0-100%の範囲に）
        const displayProgress = Math.min(100, savedProgress * 2);
        setProgress(displayProgress);
        
        // 保存された進捗に応じて正解状態を設定
        if (displayProgress > 0) {
          const questionValue = 100 / 3; // 各問題の価値（33.33%）
          setCorrectAnswers({
            ipAddress: displayProgress >= questionValue,
            subnetMask: displayProgress >= questionValue * 2,
            networkClass: displayProgress >= questionValue * 3
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
    updateProgress();
  }, [correctAnswers]);

  const checkIPAddress = () => {
    if (ipAddress.trim().startsWith("192.168.1.") && ipAddress.trim() !== "192.168.1.1" && ipAddress.trim() !== "192.168.1.10" && (() => {
      const lastOctet = parseInt(ipAddress.trim().split(".")[3], 10);
      return lastOctet > 0 && lastOctet < 255;
    })()) {
      setFeedback("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, ipAddress: true }));
    } else if (ipAddress.startsWith("192.168.1.")) {
      setFeedback("惜しい！同じネットワーク内の別のアドレスを考えてみよう。 🤔")
      setCorrectAnswers(prev => ({ ...prev, ipAddress: false }));
    } else {
      setFeedback("もう一度考えてみよう。ルーターとパソコン1のIPアドレスをヒントにしてね。 💪")
      setCorrectAnswers(prev => ({ ...prev, ipAddress: false }));
    }
  }

  const checkSubnetMask = () => {
    if (subnetMask === "255.255.255.0") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, subnetMask: true }));
    } else {
      setFeedback2("もう一度考えてみよう。一般的な家庭用ネットワークのサブネットマスクを思い出してね。 💪")
      setCorrectAnswers(prev => ({ ...prev, subnetMask: false }));
    }
  }

  const checkNetworkClass = () => {
    if (networkClass === "c") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setCorrectAnswers(prev => ({ ...prev, networkClass: true }));
    } else {
      setFeedback3("もう一度考えてみよう。192.168.x.xのネットワークはどのクラスに属するでしょうか？ 💪")
      setCorrectAnswers(prev => ({ ...prev, networkClass: false }));
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="IPアドレスの不思議 🏠" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="mt-6 space-y-4">
          <p className="text-lg">
            上の図は、小さなホームネットワークを表しています。ルーターと2台のパソコンがつながっていますね。
          </p>
          <p className="text-lg">
            IPアドレスは、インターネットの世界での住所のようなものです。
            同じネットワーク内では、最後の数字だけが違う形になっています。
          </p>
          <p className="text-lg font-semibold">パソコン2のIPアドレスはどうなるでしょうか？</p>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-2">
          <Input
            type="text"
            placeholder="パソコン2のIPアドレスを入力"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkIPAddress} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback && (
          <p className={`mt-4 text-lg ${feedback.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">このネットワークのサブネットマスクは何でしょうか？</p>
          <RadioGroup value={subnetMask} onValueChange={setSubnetMask}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="255.255.255.0" id="r1" />
              <Label htmlFor="r1">255.255.255.0</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="255.255.0.0" id="r2" />
              <Label htmlFor="r2">255.255.0.0</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="255.0.0.0" id="r3" />
              <Label htmlFor="r3">255.0.0.0</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkSubnetMask} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">このネットワーク（192.168.1.0）はどのネットワーククラスに属しますか？</p>
          <RadioGroup value={networkClass} onValueChange={setNetworkClass}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="nc1" />
              <Label htmlFor="nc1">クラスA</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="nc2" />
              <Label htmlFor="nc2">クラスB</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="nc3" />
              <Label htmlFor="nc3">クラスC</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkNetworkClass} className="bg-green-500 hover:bg-green-600 text-white">
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
              <strong>ヒント:</strong> ルーターのIPアドレスは192.168.1.1で、パソコン1は192.168.1.10です。
              パソコン2も同じネットワーク内にあるので、最初の3つの数字（192.168.1）は同じになります。
              最後の数字は、他のデバイスと被らない数字を選びましょう。
              サブネットマスクは、ネットワーク部とホスト部を区別するために使用されます。
              一般的な家庭用ネットワークでは、24ビットのネットワーク部を持つことが多いです。
              ネットワーククラスは、IPアドレスの最初のオクテット（8ビット）によって決定されます。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
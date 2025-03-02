"use client"

import { useState,useEffect } from "react"
import Link from "next/link"
import { saveProgress, getProgress } from "../utils/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Layout } from "@/components/Layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export default function NetworkBasicsPage() {
  const [ipAnswer1, setIpAnswer1] = useState("")
  const [ipAnswer2, setIpAnswer2] = useState("")
  const [ipAnswer3, setIpAnswer3] = useState("")
  const [routingAnswer1, setRoutingAnswer1] = useState("")
  const [routingAnswer2, setRoutingAnswer2] = useState("")
  const [routingAnswer3, setRoutingAnswer3] = useState("")
  const [vlanAnswer1, setVlanAnswer1] = useState("")
  const [vlanAnswer2, setVlanAnswer2] = useState("")
  const [vlanAnswer3, setVlanAnswer3] = useState("")
  const [wifiAnswer1, setWifiAnswer1] = useState("")
  const [wifiAnswer2, setWifiAnswer2] = useState("")
  const [wifiAnswer3, setWifiAnswer3] = useState("")

  const [ipFeedback1, setIpFeedback1] = useState("")
  const [ipFeedback2, setIpFeedback2] = useState("")
  const [ipFeedback3, setIpFeedback3] = useState("")
  const [routingFeedback1, setRoutingFeedback1] = useState("")
  const [routingFeedback2, setRoutingFeedback2] = useState("")
  const [routingFeedback3, setRoutingFeedback3] = useState("")
  const [vlanFeedback1, setVlanFeedback1] = useState("")
  const [vlanFeedback2, setVlanFeedback2] = useState("")
  const [vlanFeedback3, setVlanFeedback3] = useState("")
  const [wifiFeedback1, setWifiFeedback1] = useState("")
  const [wifiFeedback2, setWifiFeedback2] = useState("")
  const [wifiFeedback3, setWifiFeedback3] = useState("")

  const [progress, setProgress] = useState(0)

  // useEffectを追加して、ページロード時に保存された進捗データを取得
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        const progressData = await getProgress()
        // ネットワーク基礎の進捗データを設定
        setProgress(progressData.basic)
      } catch (error) {
        console.error('進捗データの読み込みに失敗しました:', error)
        // エラーが発生した場合でも、アプリは機能し続けるように0を設定
        setProgress(0)
      }
    }
    
    loadSavedProgress()
  }, [])

  // 既存のupdateOverallProgress関数を修正
  const updateOverallProgress = (newProgress: number) => {
    // 新しい進捗を状態にセット
    setProgress(newProgress)
    
    // 全ての問題数（4セクション×3問 = 12問）
    const totalQuestions = 12
    // 正解した問題数（全体進捗率×問題数）
    const correctAnswers = (newProgress / 100) * totalQuestions
    
    // 正解率を計算（%）
    const completionRate = (correctAnswers / totalQuestions) * 100
    
    // IndexedDBに保存
    saveProgress('basic', completionRate).catch(console.error)
  }

  const checkIpAnswer1 = () => {
    const inputIP = ipAnswer1.trim()
    const ipParts = inputIP.split(".")

    if (
      ipParts.length === 4 &&
      ipParts[0] === "192" &&
      ipParts[1] === "168" &&
      ipParts[2] === "1" &&
      Number.parseInt(ipParts[3]) >= 2 &&
      Number.parseInt(ipParts[3]) <= 254
    ) {
      setIpFeedback1("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setIpFeedback1("不正解です。192.168.1.2 から 192.168.1.254 の範囲で考えてみましょう。")
    }
  }

  const checkIpAnswer2 = () => {
    if (ipAnswer2 === "c") {
      setIpFeedback2("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setIpFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkIpAnswer3 = () => {
    if (ipAnswer3 === "b") {
      setIpFeedback3("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.34, 100))
    } else {
      setIpFeedback3("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkRoutingAnswer1 = () => {
    if (routingAnswer1 === "b") {
      setRoutingFeedback1("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setRoutingFeedback1("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkRoutingAnswer2 = () => {
    if (routingAnswer2 === "a") {
      setRoutingFeedback2("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setRoutingFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkRoutingAnswer3 = () => {
    if (routingAnswer3 === "c") {
      setRoutingFeedback3("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.34, 100))
    } else {
      setRoutingFeedback3("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkVlanAnswer1 = () => {
    if (vlanAnswer1 === "c") {
      setVlanFeedback1("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setVlanFeedback1("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkVlanAnswer2 = () => {
    if (vlanAnswer2 === "b") {
      setVlanFeedback2("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setVlanFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkVlanAnswer3 = () => {
    if (vlanAnswer3 === "a") {
      setVlanFeedback3("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.34, 100))
    } else {
      setVlanFeedback3("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkWifiAnswer1 = () => {
    if (wifiAnswer1.toLowerCase() === "ssid") {
      setWifiFeedback1("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setWifiFeedback1("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkWifiAnswer2 = () => {
    if (wifiAnswer2 === "c") {
      setWifiFeedback2("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.33, 100))
    } else {
      setWifiFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkWifiAnswer3 = () => {
    if (wifiAnswer3 === "b") {
      setWifiFeedback3("正解です！ 👍")
      updateOverallProgress(Math.min(progress + 8.34, 100))
    } else {
      setWifiFeedback3("不正解です。もう一度考えてみましょう。")
    }
  }

  return (
    <Layout title="ネットワーク基礎知識 📚" backLink="/" backText="トップメニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        {/* IPアドレスセクション */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">IPアドレス</h2>
          <p className="mb-2">
            IPアドレスは、ネットワーク上のデバイスを識別するための番号です。
            IPv4アドレスは、4つの数字（0〜255）をドットで区切った形式で表されます。
          </p>
          <p className="mb-2">例: 192.168.1.1</p>
          <p className="mb-4">
            同じネットワーク内のデバイスは、通常、最初の3つの数字が同じで、最後の数字だけが異なります。
          </p>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 1</h3>
            <p className="mb-2">
              ルーターのIPアドレスが192.168.1.1の場合、同じネットワーク内のPCに割り当てられる可能性のあるIPアドレスは何ですか？
            </p>
            <Input
              type="text"
              placeholder="IPアドレスを入力"
              value={ipAnswer1}
              onChange={(e) => setIpAnswer1(e.target.value)}
              className="mb-2 bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkIpAnswer1}>回答する</Button>
            {ipFeedback1 && <p className="mt-2">{ipFeedback1}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 2</h3>
            <p className="mb-2">IPアドレス 192.168.1.1 のネットワーククラスは何ですか？</p>
            <RadioGroup value={ipAnswer2} onValueChange={setIpAnswer2}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="ip-a" />
                <Label htmlFor="ip-a">クラスA</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="ip-b" />
                <Label htmlFor="ip-b">クラスB</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="ip-c" />
                <Label htmlFor="ip-c">クラスC</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkIpAnswer2} className="mt-2">
              回答する
            </Button>
            {ipFeedback2 && <p className="mt-2">{ipFeedback2}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題 3</h3>
            <p className="mb-2">次のうち、プライベートIPアドレスの範囲はどれですか？</p>
            <RadioGroup value={ipAnswer3} onValueChange={setIpAnswer3}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="ip-range-a" />
                <Label htmlFor="ip-range-a">11.0.0.0 - 11.255.255.255</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="ip-range-b" />
                <Label htmlFor="ip-range-b">172.16.0.0 - 172.31.255.255</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="ip-range-c" />
                <Label htmlFor="ip-range-c">200.0.0.0 - 200.255.255.255</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkIpAnswer3} className="mt-2">
              回答する
            </Button>
            {ipFeedback3 && <p className="mt-2">{ipFeedback3}</p>}
          </div>
        </section>

        {/* ルーティングセクション */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">ルーティング</h2>
          <p className="mb-2">
            ルーティングは、データパケットが出発地から目的地まで最適な経路を見つけて送信される過程です。
          </p>
          <p className="mb-2">ルーターは、異なるネットワーク間でデータを転送する装置です。</p>
          <p className="mb-4">スタティックルーティングは、管理者が手動でルーティングテーブルを設定する方法です。</p>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 1</h3>
            <p className="mb-2">スタティックルーティングの利点は何ですか？</p>
            <RadioGroup value={routingAnswer1} onValueChange={setRoutingAnswer1}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r1" />
                <Label htmlFor="r1">ネットワークの変更に自動的に対応できる</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r2" />
                <Label htmlFor="r2">設定が簡単で、小規模ネットワークに適している</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r3" />
                <Label htmlFor="r3">大規模ネットワークでの拡張性が高い</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkRoutingAnswer1} className="mt-2">
              回答する
            </Button>
            {routingFeedback1 && <p className="mt-2">{routingFeedback1}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 2</h3>
            <p className="mb-2">スタティックルートを設定する際に必要な情報は何ですか？</p>
            <RadioGroup value={routingAnswer2} onValueChange={setRoutingAnswer2}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r4" />
                <Label htmlFor="r4">宛先ネットワーク、サブネットマスク、ネクストホップ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r5" />
                <Label htmlFor="r5">送信元IPアドレス、宛先IPアドレス、ポート番号</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r6" />
                <Label htmlFor="c">MACアドレス、IPアドレス、デフォルトゲートウェイ</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkRoutingAnswer2} className="mt-2">
              回答する
            </Button>
            {routingFeedback2 && <p className="mt-2">{routingFeedback2}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題 3</h3>
            <p className="mb-2">デフォルトルート（0.0.0.0/0）の役割は何ですか？</p>
            <RadioGroup value={routingAnswer3} onValueChange={setRoutingAnswer3}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r7" />
                <Label htmlFor="r7">最も高速なルートを選択する</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r8" />
                <Label htmlFor="r8">ルーティングテーブルを自動的に更新する</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r9" />
                <Label htmlFor="r9">他のルートが一致しない場合に使用される</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkRoutingAnswer3} className="mt-2">
              回答する
            </Button>
            {routingFeedback3 && <p className="mt-2">{routingFeedback3}</p>}
          </div>
        </section>

        {/* VLANセクション */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">VLAN (仮想LAN)</h2>
          <p className="mb-2">VLANは、1つの物理的なネットワークを複数の論理的なネットワークに分割する技術です。</p>
          <p className="mb-2">各VLANには固有のIDが割り当てられ、通常1〜4094の範囲の数字が使用されます。</p>
          <p className="mb-4">VLANを使用すると、物理的な配置に関係なく、部門や機能ごとにネットワークを分離できます。</p>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 1</h3>
            <p className="mb-2">VLANの主な利点は何ですか？</p>
            <RadioGroup value={vlanAnswer1} onValueChange={setVlanAnswer1}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="v1" />
                <Label htmlFor="v1">インターネット速度の向上</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="v2" />
                <Label htmlFor="v2">データの暗号化</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="v3" />
                <Label htmlFor="v3">ネットワークの論理的な分割</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkVlanAnswer1} className="mt-2">
              回答する
            </Button>
            {vlanFeedback1 && <p className="mt-2">{vlanFeedback1}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 2</h3>
            <p className="mb-2">VLANを使用する際、異なるVLAN間の通信には何が必要ですか？</p>
            <RadioGroup value={vlanAnswer2} onValueChange={setVlanAnswer2}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="v4" />
                <Label htmlFor="v4">ハブ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="v5" />
                <Label htmlFor="v5">ルータ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="v6" />
                <Label htmlFor="v6">リピータ</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkVlanAnswer2} className="mt-2">
              回答する
            </Button>
            {vlanFeedback2 && <p className="mt-2">{vlanFeedback2}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題 3</h3>
            <p className="mb-2">トランクポートの主な役割は何ですか？</p>
            <RadioGroup value={vlanAnswer3} onValueChange={setVlanAnswer3}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="v7" />
                <Label htmlFor="v7">複数のVLANのトラフィックを伝送する</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="v8" />
                <Label htmlFor="v8">VLANを作成する</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="v9" />
                <Label htmlFor="v9">IPアドレスを割り当てる</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkVlanAnswer3} className="mt-2">
              回答する
            </Button>
            {vlanFeedback3 && <p className="mt-2">{vlanFeedback3}</p>}
          </div>
        </section>

        {/* 無線LANセクション */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">無線LAN (Wi-Fi)</h2>
          <p className="mb-2">無線LANは、ケーブルを使用せずにデバイスをネットワークに接続する技術です。</p>
          <p className="mb-2">SSID (Service Set Identifier) は、Wi-Fiネットワークの名前です。</p>
          <p className="mb-2">
            Wi-Fiセキュリティプロトコルには、WEP、WPA、WPA2、WPA3などがあります。
            最新のプロトコルほどセキュリティが強化されています。
          </p>
          <p className="mb-4">
            Wi-Fiチャネルは、無線信号が送信される特定の周波数帯を指します。
            2.4GHz帯では1〜14、5GHz帯ではさらに多くのチャネルが利用可能です。
          </p>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 1</h3>
            <p className="mb-2">Wi-Fiネットワークの名前を何と呼びますか？（略語で答えてください）</p>
            <Input
              type="text"
              placeholder="略語を入力"
              value={wifiAnswer1}
              onChange={(e) => setWifiAnswer1(e.target.value)}
              className="mb-2 bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkWifiAnswer1}>回答する</Button>
            {wifiFeedback1 && <p className="mt-2">{wifiFeedback1}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 2</h3>
            <p className="mb-2">次のうち、最も安全なWi-Fiセキュリティプロトコルはどれですか？</p>
            <RadioGroup value={wifiAnswer2} onValueChange={setWifiAnswer2}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="w1" />
                <Label htmlFor="w1">WEP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="w2" />
                <Label htmlFor="w2">WPA2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="w3" />
                <Label htmlFor="w3">WPA3</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkWifiAnswer2} className="mt-2">
              回答する
            </Button>
            {wifiFeedback2 && <p className="mt-2">{wifiFeedback2}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題 3</h3>
            <p className="mb-2">2.4GHz帯のWi-Fiで一般的に使用可能なチャネル数は？</p>
            <RadioGroup value={wifiAnswer3} onValueChange={setWifiAnswer3}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="w4" />
                <Label htmlFor="w4">5チャネル</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="w5" />
                <Label htmlFor="w5">14チャネル</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="w6" />
                <Label htmlFor="w6">20チャネル</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkWifiAnswer3} className="mt-2">
              回答する
            </Button>
            {wifiFeedback3 && <p className="mt-2">{wifiFeedback3}</p>}
          </div>
        </section>

        <Progress value={progress} className="mt-4 mb-2 h-3 md:h-4 rounded-full" />
      <p className="text-base md:text-lg text-gray-200 mb-4">進捗: {progress.toFixed(2)}% 🚀</p>
      </div>
    </Layout>
  )
}


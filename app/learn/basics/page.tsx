"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Layout } from "@/components/Layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export default function NetworkBasicsPage() {
  const [ipAnswer1, setIpAnswer1] = useState("")
  const [ipAnswer2, setIpAnswer2] = useState("")
  const [routingAnswer1, setRoutingAnswer1] = useState("")
  const [routingAnswer2, setRoutingAnswer2] = useState("")
  const [vlanAnswer1, setVlanAnswer1] = useState("")
  const [vlanAnswer2, setVlanAnswer2] = useState("")
  const [wifiAnswer1, setWifiAnswer1] = useState("")
  const [wifiAnswer2, setWifiAnswer2] = useState("")

  const [ipFeedback1, setIpFeedback1] = useState("")
  const [ipFeedback2, setIpFeedback2] = useState("")
  const [routingFeedback1, setRoutingFeedback1] = useState("")
  const [routingFeedback2, setRoutingFeedback2] = useState("")
  const [vlanFeedback1, setVlanFeedback1] = useState("")
  const [vlanFeedback2, setVlanFeedback2] = useState("")
  const [wifiFeedback1, setWifiFeedback1] = useState("")
  const [wifiFeedback2, setWifiFeedback2] = useState("")

  const [progress, setProgress] = useState(0)

  const checkIpAnswer1 = () => {
    if (ipAnswer1.trim().toLowerCase() === "192.168.1.2") {
      setIpFeedback1("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setIpFeedback1("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkIpAnswer2 = () => {
    if (ipAnswer2 === "c") {
      setIpFeedback2("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setIpFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkRoutingAnswer1 = () => {
    if (routingAnswer1 === "b") {
      setRoutingFeedback1("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setRoutingFeedback1("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkRoutingAnswer2 = () => {
    if (routingAnswer2 === "a") {
      setRoutingFeedback2("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setRoutingFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkVlanAnswer1 = () => {
    if (vlanAnswer1 === "c") {
      setVlanFeedback1("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setVlanFeedback1("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkVlanAnswer2 = () => {
    if (vlanAnswer2 === "b") {
      setVlanFeedback2("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setVlanFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkWifiAnswer1 = () => {
    if (wifiAnswer1.toLowerCase() === "ssid") {
      setWifiFeedback1("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setWifiFeedback1("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkWifiAnswer2 = () => {
    if (wifiAnswer2 === "c") {
      setWifiFeedback2("正解です！ 👍")
      setProgress((prev) => Math.min(prev + 12.5, 100))
    } else {
      setWifiFeedback2("不正解です。もう一度考えてみましょう。")
    }
  }

  return (
    <Layout title="ネットワーク基礎知識 📚" backLink="/learn" backText="学習メニューに戻る">
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
              ルーターのIPアドレスが192.168.1.1の場合、同じネットワーク内のPCに割り当てられる可能性のあるIPアドレスは次のうちどれですか？
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
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
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
        </section>

        {/* ルーティングセクション */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">ルーティング</h2>
          <p className="mb-2">
            ルーティングは、データパケットが出発地から目的地まで最適な経路を見つけて送信される過程です。
          </p>
          <p className="mb-2">ルーターは、異なるネットワーク間でデータを転送する装置です。</p>
          <p className="mb-4">
            ルーティングテーブルには、宛先ネットワークと、そのネットワークに到達するための次のホップ（転送先）の情報が含まれています。
          </p>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-bold mb-2">問題 1</h3>
            <p className="mb-2">ルーターの主な役割は何ですか？</p>
            <RadioGroup value={routingAnswer1} onValueChange={setRoutingAnswer1}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r1" />
                <Label htmlFor="r1">データの保存</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r2" />
                <Label htmlFor="r2">異なるネットワーク間でのデータ転送</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r3" />
                <Label htmlFor="r3">ウェブサイトの表示</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkRoutingAnswer1} className="mt-2">
              回答する
            </Button>
            {routingFeedback1 && <p className="mt-2">{routingFeedback1}</p>}
          </div>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題 2</h3>
            <p className="mb-2">次のうち、動的ルーティングプロトコルはどれですか？</p>
            <RadioGroup value={routingAnswer2} onValueChange={setRoutingAnswer2}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="r4" />
                <Label htmlFor="r4">OSPF (Open Shortest Path First)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="r5" />
                <Label htmlFor="r5">NAT (Network Address Translation)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="r6" />
                <Label htmlFor="r6">ARP (Address Resolution Protocol)</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkRoutingAnswer2} className="mt-2">
              回答する
            </Button>
            {routingFeedback2 && <p className="mt-2">{routingFeedback2}</p>}
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
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題 2</h3>
            <p className="mb-2">VLANを使用する際、異なるVLAN間の通信には何が必要ですか？</p>
            <RadioGroup value={vlanAnswer2} onValueChange={setVlanAnswer2}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="v4" />
                <Label htmlFor="v4">ハブ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="v5" />
                <Label htmlFor="v5">ルーター</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="c" id="v6" />
                <Label htmlFor="v6">リピーター</Label>
              </div>
            </RadioGroup>
            <Button onClick={checkVlanAnswer2} className="mt-2">
              回答する
            </Button>
            {vlanFeedback2 && <p className="mt-2">{vlanFeedback2}</p>}
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
            Wi-Fiチャンネルは、無線信号が送信される特定の周波数帯を指します。
            2.4GHz帯では1〜14、5GHz帯ではさらに多くのチャンネルが利用可能です。
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
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
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
        </section>

        <Progress value={progress} className="mt-4 mb-2 h-3 md:h-4 rounded-full" />
        <p className="text-base md:text-lg text-gray-200 mb-4">進捗: {progress}% 🚀</p>

        <div className="text-center">
          <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
            <Link href="/learn">学習を続ける</Link>
          </Button>
        </div>
      </div>
    </Layout>
  )
}


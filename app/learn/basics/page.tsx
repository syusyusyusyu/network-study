"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Layout } from "@/components/Layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function NetworkBasicsPage() {
  const [ipAnswer, setIpAnswer] = useState("")
  const [routingAnswer, setRoutingAnswer] = useState("")
  const [vlanAnswer, setVlanAnswer] = useState("")
  const [wifiAnswer, setWifiAnswer] = useState("")

  const [ipFeedback, setIpFeedback] = useState("")
  const [routingFeedback, setRoutingFeedback] = useState("")
  const [vlanFeedback, setVlanFeedback] = useState("")
  const [wifiFeedback, setWifiFeedback] = useState("")

  const checkIpAnswer = () => {
    if (ipAnswer.trim() === "192.168.1.2") {
      setIpFeedback("正解です！ 👍")
    } else {
      setIpFeedback("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkRoutingAnswer = () => {
    if (routingAnswer === "b") {
      setRoutingFeedback("正解です！ 👍")
    } else {
      setRoutingFeedback("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkVlanAnswer = () => {
    if (vlanAnswer === "c") {
      setVlanFeedback("正解です！ 👍")
    } else {
      setVlanFeedback("不正解です。もう一度考えてみましょう。")
    }
  }

  const checkWifiAnswer = () => {
    if (wifiAnswer.toLowerCase() === "ssid") {
      setWifiFeedback("正解です！ 👍")
    } else {
      setWifiFeedback("不正解です。もう一度考えてみましょう。")
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
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題</h3>
            <p className="mb-2">
              ルーターのIPアドレスが192.168.1.1の場合、同じネットワーク内のPCに割り当てられる可能性のあるIPアドレスは次のうちどれですか？
            </p>
            <Input
              type="text"
              placeholder="IPアドレスを入力"
              value={ipAnswer}
              onChange={(e) => setIpAnswer(e.target.value)}
              className="mb-2 bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkIpAnswer}>回答する</Button>
            {ipFeedback && <p className="mt-2">{ipFeedback}</p>}
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
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題</h3>
            <p className="mb-2">ルーターの主な役割は何ですか？</p>
            <RadioGroup value={routingAnswer} onValueChange={setRoutingAnswer}>
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
            <Button onClick={checkRoutingAnswer} className="mt-2">
              回答する
            </Button>
            {routingFeedback && <p className="mt-2">{routingFeedback}</p>}
          </div>
        </section>

        {/* VLANセクション */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">VLAN (仮想LAN)</h2>
          <p className="mb-2">VLANは、1つの物理的なネットワークを複数の論理的なネットワークに分割する技術です。</p>
          <p className="mb-2">各VLANには固有のIDが割り当てられ、通常1〜4094の範囲の数字が使用されます。</p>
          <p className="mb-4">VLANを使用すると、物理的な配置に関係なく、部門や機能ごとにネットワークを分離できます。</p>
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題</h3>
            <p className="mb-2">VLANの主な利点は何ですか？</p>
            <RadioGroup value={vlanAnswer} onValueChange={setVlanAnswer}>
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
            <Button onClick={checkVlanAnswer} className="mt-2">
              回答する
            </Button>
            {vlanFeedback && <p className="mt-2">{vlanFeedback}</p>}
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
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">問題</h3>
            <p className="mb-2">Wi-Fiネットワークの名前を何と呼びますか？（略語で答えてください）</p>
            <Input
              type="text"
              placeholder="略語を入力"
              value={wifiAnswer}
              onChange={(e) => setWifiAnswer(e.target.value)}
              className="mb-2 bg-white text-black placeholder-gray-500"
            />
            <Button onClick={checkWifiAnswer}>回答する</Button>
            {wifiFeedback && <p className="mt-2">{wifiFeedback}</p>}
          </div>
        </section>

        <div className="text-center">
          <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
            <Link href="/learn">学習を続ける</Link>
          </Button>
        </div>
      </div>
    </Layout>
  )
}


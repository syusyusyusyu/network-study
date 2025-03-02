"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { NetworkDiagram } from "@/components/NetworkDiagram"
import { Layout } from "@/components/Layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const devices = [
  { type: "router" as const, x: 300, y: 50, label: "無線ルーター", ip: "192.168.1.1" },
  { type: "pc" as const, x: 150, y: 150, label: "ノートPC", ip: "192.168.1.10" },
  { type: "pc" as const, x: 450, y: 150, label: "スマートフォン", ip: "192.168.1.20" },
]

const connections = [
  { from: 0, to: 1, label: "Wi-Fi" },
  { from: 0, to: 2, label: "Wi-Fi" },
]

export default function WirelessLearnPage() {
  const [ssid, setSSID] = useState("")
  const [securityProtocol, setSecurityProtocol] = useState("")
  const [channel, setChannel] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedback2, setFeedback2] = useState("")
  const [feedback3, setFeedback3] = useState("")
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const checkSSID = () => {
    if (ssid.trim().toLowerCase() === "myhomewifi") {
      setFeedback("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else if (ssid.trim().length > 0) {
      setFeedback("惜しい！SSIDは通常、分かりやすい名前が使われます。もう一度考えてみよう。 🤔")
      setProgress((prev) => Math.min(prev + 16, 100))
    } else {
      setFeedback("SSIDを入力してください。ヒントを参考にしてみてね。 💪")
    }
  }

  const checkSecurityProtocol = () => {
    if (securityProtocol === "wpa3") {
      setFeedback2("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 33, 100))
    } else {
      setFeedback2("もう一度考えてみよう。最新で最も安全なWi-Fiセキュリティプロトコルはどれでしょうか？ 💪")
    }
  }

  const checkChannel = () => {
    if (channel === "b") {
      setFeedback3("正解です！素晴らしい！ 🎉")
      setProgress((prev) => Math.min(prev + 34, 100))
    } else {
      setFeedback3("もう一度考えてみよう。2.4GHz帯で使用可能なチャンネル数を確認してみてね。 💪")
    }
  }

  const toggleHint = () => {
    setShowHint(!showHint)
  }

  return (
    <Layout title="空飛ぶネット 📡" backLink="/learn" backText="学習メニューに戻る">
      <div className="bg-white bg-opacity-30 text-white p-4 md:p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
        <NetworkDiagram devices={devices} connections={connections} />

        <div className="mt-6 space-y-4">
          <p className="text-lg">上の図は、無線LANルーターとそれに接続された2つのデバイスを表しています。</p>
          <p className="text-lg">
            無線LAN（Wi-Fi）は、ケーブルを使わずにインターネットに接続できる技術です。
            SSIDは、Wi-Fiネットワークの名前のことで、デバイスがネットワークを識別するために使用します。
          </p>
          <p className="text-lg font-semibold">この家庭用Wi-FiネットワークのSSIDは何だと思いますか？</p>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-2">
          <Input
            type="text"
            placeholder="SSIDを入力"
            value={ssid}
            onChange={(e) => setSSID(e.target.value)}
            className="flex-1 bg-white text-black placeholder-gray-500"
          />
          <Button onClick={checkSSID} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback && (
          <p className={`mt-4 text-lg ${feedback.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">最新のWi-Fiセキュリティプロトコルは次のうちどれでしょうか？</p>
          <RadioGroup value={securityProtocol} onValueChange={setSecurityProtocol}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wep" id="r1" />
              <Label htmlFor="r1">WEP</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wpa2" id="r2" />
              <Label htmlFor="r2">WPA2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wpa3" id="r3" />
              <Label htmlFor="r3">WPA3</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkSecurityProtocol} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback2 && (
          <p className={`mt-4 text-lg ${feedback2.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback2}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-lg font-semibold">2.4GHz帯のWi-Fiで使用可能なチャネル数は通常いくつですか？</p>
          <RadioGroup value={channel} onValueChange={setChannel}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a" id="c1" />
              <Label htmlFor="c1">5チャネル</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b" id="c2" />
              <Label htmlFor="c2">14チャネル</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="c" id="c3" />
              <Label htmlFor="c3">20チャネル</Label>
            </div>
          </RadioGroup>
          <Button onClick={checkChannel} className="bg-green-500 hover:bg-green-600 text-white">
            チェック
          </Button>
        </div>

        {feedback3 && (
          <p className={`mt-4 text-lg ${feedback3.includes("正解") ? "text-green-300" : "text-yellow-300"}`}>
            {feedback3}
          </p>
        )}

        <Progress value={progress} className="mt-4 mb-2 h-3 md:h-4 rounded-full" />
        <p className="text-base md:text-lg text-gray-200 mb-4">理解度: {progress}% 🚀</p>

        <Button onClick={toggleHint} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          {showHint ? "ヒントを隠す 🙈" : "ヒントを見る 💡"}
        </Button>

        {showHint && (
          <div className="mt-4 bg-blue-100 bg-opacity-20 p-4 rounded-lg">
            <p className="text-base md:text-lg text-white">
              <strong>ヒント:</strong> SSIDは通常、ネットワークの所有者や目的を示す分かりやすい名前が使われます。
              この場合、家庭用のWi-Fiネットワークなので、どんな名前が適切でしょうか？
              例えば、"MyHomeWiFi"のような名前かもしれません。
              Wi-Fiセキュリティプロトコルは、時代とともに進化しています。最新のプロトコルは、
              より強力な暗号化と認証メカニズムを提供します。
              2.4GHz帯のWi-Fiチャネルは、国や地域によって異なる場合がありますが、
              多くの国では1から13または14のチャネルが使用可能です。
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}


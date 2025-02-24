import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Layout } from "@/components/Layout"
import { Network, Route, Share2, Wifi } from "lucide-react"

const challenges = [
  {
    title: "IPアドレス設定",
    description: "小規模オフィスのネットワークをセットアップしよう",
    href: "/challenge/ip-address",
    icon: Network,
  },
  {
    title: "ルーティング設定",
    description: "複数のネットワークを接続しよう",
    href: "/challenge/routing",
    icon: Route,
  },
  {
    title: "VLAN設定",
    description: "部門ごとにネットワークを分離しよう",
    href: "/challenge/vlan",
    icon: Share2,
  },
  {
    title: "無線LAN設定",
    description: "安全なWi-Fiネットワークを構築しよう",
    href: "/challenge/wireless",
    icon: Wifi,
  },
]

export default function ChallengePage() {
  return (
    <Layout title="チャレンジモード編 🏆" backLink="/" backText="トップメニューに戻る">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {challenges.map((challenge) => (
          <Button
            key={challenge.href}
            asChild
            variant="secondary"
            className="h-auto text-left p-6 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 
            transition-all duration-200 transform hover:scale-105 flex flex-col items-center"
          >
            <Link href={challenge.href}>
              <challenge.icon size={48} className="mb-4 text-white" />
              <h2 className="text-2xl font-bold mb-2 text-center text-white">{challenge.title}</h2>
              <p className="text-base text-center text-white">{challenge.description}</p>
            </Link>
          </Button>
        ))}
      </div>
    </Layout>
  )
}


import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Route, Network, Wifi } from "lucide-react"
import { Layout } from "@/components/Layout"

const topics = [
  {
    title: "IPアドレスの不思議",
    description: "インターネットの住所を探検しよう",
    href: "/learn/ip-address",
    icon: Network,
  },
  {
    title: "道案内マスター",
    description: "データの旅路を導こう",
    href: "/learn/routing",
    icon: Route,
  },
  {
    title: "仲間分けの魔法",
    description: "ネットワークを整理整頓",
    href: "/learn/vlan",
    icon: Network,
  },
  {
    title: "空飛ぶネット",
    description: "Wi-Fiの秘密を解き明かそう",
    href: "/learn/wireless",
    icon: Wifi,
  },
]

export default function LearnPage() {
  return (
    <Layout title="学習モード編 🗺️" backLink="/.." backText="トップメニューに戻る">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {topics.map((topic) => (
          <Button
            key={topic.href}
            asChild
            variant="secondary"
            className="h-auto text-left p-6 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 
            transition-all duration-200 transform hover:scale-105 flex flex-col items-center"
          >
            <Link href={topic.href}>
              <topic.icon size={48} className="mb-4 text-white" />
              <h2 className="text-2xl font-bold mb-2 text-center text-white">{topic.title}</h2>
              <p className="text-base text-center text-white">{topic.description}</p>
            </Link>
          </Button>
        ))}
      </div>
    </Layout>
  )
}


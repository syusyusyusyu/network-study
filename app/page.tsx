import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Trophy, BarChart } from "lucide-react"
import { Layout } from "@/components/Layout"

export default function Home() {
  return (
    <Layout title="ネットワークの浅瀬を冒険（仮） 🚀">
      <div className="text-center mb-8">
        <p className="text-xl md:text-2xl mb-8 text-white max-w-2xl mx-auto px-4">
          ネットワークの仕組みを楽しく学ぼう！
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
        {[
          { href: "/learn", icon: BookOpen, title: "学習モード", description: "基礎を学ぼう" },
          { href: "/challenge", icon: Trophy, title: "チャレンジモード", description: "腕試しをしよう" },
          { href: "/dashboard", icon: BarChart, title: "ダッシュボード", description: "進捗を確認しよう" },
        ].map((item) => (
          <Button
            key={item.href}
            asChild
            className="h-auto py-8 text-xl flex flex-col items-center bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 transform hover:scale-105 text-white"
          >
            <Link href={item.href}>
              <item.icon size={48} className="mb-4" />
              <span>{item.title}</span>
              <span className="text-sm mt-2">{item.description}</span>
            </Link>
          </Button>
        ))}
      </div>
    </Layout>
  )
}


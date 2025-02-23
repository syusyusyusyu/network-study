import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
  title: string
  backLink?: string
  backText?: string
}

export const Layout: React.FC<LayoutProps> = ({ children, title, backLink, backText }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 flex flex-col items-center justify-center p-4">
      <header className="w-full max-w-4xl mb-8">
        <nav>
          <Button asChild variant="ghost" className="text-white hover:text-blue-100">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              ホーム
            </Link>
          </Button>
        </nav>
      </header>
      <main className="w-full max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center text-white px-4">{title}</h1>
        {children}
      </main>
      <footer className="w-full max-w-4xl mt-8 text-center">
        {backLink && (
          <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
            <Link href={backLink}>{backText || "戻る"}</Link>
          </Button>
        )}
      </footer>
    </div>
  )
}


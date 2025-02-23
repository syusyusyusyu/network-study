import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Fredoka, Nunito } from "next/font/google"

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
})

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nunito",
})

export const metadata: Metadata = {
  title: "ネットワーク冒険物語",
  description: "ネットワークの仕組みを楽しく学ぼう！",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${fredoka.variable} ${nunito.variable} font-nunito`}>{children}</body>
    </html>
  )
}



import './globals.css'
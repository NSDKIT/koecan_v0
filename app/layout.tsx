import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OneSignalProvider } from '@/components/OneSignalProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '声キャン！ - セルフサービス型アンケートツール',
  description: 'ポイ活しながら、キャリア相談ができる！あなたの声が未来を作る、新しいプラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <OneSignalProvider>
          {children}
        </OneSignalProvider>
      </body>
    </html>
  )
}
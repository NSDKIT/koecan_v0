import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/contexts/SupabaseProvider' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '声キャン！ - セルフサービス型アンケートツール',
  description: 'ポイ活しながら、キャリア相談ができる！あなたの声が未来を作る、新しいプラットフォーム',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#f69435" />
        
        {/* ★★★ OneSignal SDK ロードと初期化のコードを削除 ★★★ */}
        
      </head>
      <body className={inter.className}>
        {/* ★★★ SupabaseProviderでラップする ★★★ */}
        <SupabaseProvider>
            {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}

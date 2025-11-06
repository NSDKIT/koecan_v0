// koecan_v0-main/app/layout.tsx

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/contexts/SupabaseProvider' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '声キャン！ - セルフサービス型アンケートツール',
  description: 'ポイ活しながら、キャリア相談ができる！あなたの声が未来を作る、新しいプラットフォーム',
  manifest: '/manifest.json',
  // ★★★ 修正箇所: メタデータに Service Worker の設定は不要 (headにスクリプトを追加) ★★★
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
        
        {/* ★★★ 修正箇所: Service Worker 登録スクリプトの追加 ★★★ */}
        {/* Service Worker の登録はブラウザ側でのみ行われるようにする */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
                    .then(registration => {
                      console.log('SW registered: ', registration);
                    }).catch(registrationError => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
        
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

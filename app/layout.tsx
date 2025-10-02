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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="声キャン" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="256x256" href="/icon-256x256.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icon-384x384.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
        <meta name="theme-color" content="#f69435" />
        
        {/* ★★★ OneSignal SDK ロードと初期化のコード (async/awaitを適用) ★★★ */}
        <script
          async
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function() { // async function を適用
                await OneSignal.init({ // await を適用して初期化完了を待機
                    appId: "66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1", 
                    allowLocalhostAsSecureOrigin: true,
                    // Service Worker のカスタムパス設定を削除
                });
              });
            `,
          }}
        />
        {/* ★★★ OneSignal SDK ロードと初期化のコードここまで ★★★ */}

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

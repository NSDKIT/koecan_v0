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
        
        {/* ★★★ OneSignal SDK ロードと初期化のコード (最終クリーンアップ版) ★★★ */}
        <script
          async
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(function() {
                OneSignal.init({
                    appId: "66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1", 
                    allowLocalhostAsSecureOrigin: true,
                    // Service Workerファイルをpublicから削除したため、パス設定は不要
                    // OneSignal SDKがCDNからワーカーファイルをロードします
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

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/contexts/SupabaseProvider' 
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '声キャン！ - セルフサービス型アンケートツール',
  description: 'ポイ活しながら、キャリア相談ができる！あなたの声が未来を作る、新しいプラットフォーム',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f69435',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* OneSignal SDK */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="beforeInteractive"
        />
        <Script id="onesignal-init" strategy="beforeInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function() {
              await OneSignal.init({
                appId: "66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1", 
                allowLocalhostAsSecureOrigin: true,
              });
            });
          `}
        </Script>
        
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}

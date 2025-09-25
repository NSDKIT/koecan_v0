/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.pexels.com'],
  },
  
  // ★★★ 修正点1: 不要なenvブロックを削除 ★★★
  // .env.localファイルがあれば、Next.jsが自動で環境変数を読み込みます。
  // ここに記述する必要はありません。

  // ★★★ 修正点2: キャッシュ制御ヘッダーを追加 ★★★
  async headers() {
    return [
      {
        // アプリケーションのすべてのパスに適用
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // この設定はブラウザにファイルをキャッシュさせないように指示します。
            // これにより、ユーザーは常に最新のコードを取得できます。
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

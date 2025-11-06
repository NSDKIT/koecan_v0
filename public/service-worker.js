// koecan_v0-main/public/service-worker.js

// サービスワーカーがインストールされたときに実行されます
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // 新しいSWがすぐにアクティブになるようにする
});

// サービスワーカーがアクティブになったときに実行されます
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  // すぐにクライアントを制御開始
  event.waitUntil(self.clients.claim());
});

// fetchイベント（ネットワークリクエスト）を傍受します
self.addEventListener('fetch', (event) => {
  // キャッシュ戦略などをここに実装しますが、ここでは単純にネットワークにフォールバック
  // これにより、PWAの要件（fetchイベントの処理）を満たします
  event.respondWith(fetch(event.request));
});

console.log('[Service Worker] Loaded.');

# OneSignal統合済みNext.jsプロジェクト

このプロジェクトは、Zennの記事「OneSignal、Next.js、VercelでWebプッシュ通知を作る」の【２】Next.jsにOneSignalを組み込む部分が実装済みです。

## 実装済み機能

### OneSignal統合
- OneSignal SDK の組み込み
- プッシュ通知許可ボタンの実装
- 日本語対応の通知メッセージ
- ローカル開発環境対応

### 実装されたファイル

#### 新規追加ファイル
- `components/OneSignalProvider.tsx` - OneSignal初期化プロバイダー
- `components/OneSignalButton.tsx` - カスタム通知許可ボタン
- `public/OneSignalSDKWorker.js` - OneSignal SDKワーカーファイル

#### 更新されたファイル
- `app/layout.tsx` - OneSignalProviderを追加
- `components/WelcomeScreen.tsx` - OneSignalButtonを統合
- `public/OneSignalSDKUpdaterWorker.js` - ローカルSDK参照に修正

## OneSignal設定

### App ID
```
66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1
```

### 設定内容
- 通知ボタン有効化
- 日本語メッセージ対応
- ローカル開発環境許可
- カスタムボタン実装

## セットアップ手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

3. **ブラウザでアクセス**
   ```
   http://localhost:3000
   ```

## 注意事項

### ローカル環境での制限
- HTTPSが必要なため、ローカル環境では通知許可ダイアログが表示されない場合があります
- 完全な動作確認にはHTTPS環境（Vercel等）でのデプロイが必要です

### ブラウザサポート
- Chrome: 完全サポート
- Firefox: 完全サポート
- Safari: iOS 16.4以降でサポート
- Edge: 完全サポート

## 次のステップ

記事の続きを実装する場合：

### 【３】GitHubからVercelへデプロイする
1. GitHubリポジトリを作成
2. コードをプッシュ
3. Vercelでデプロイ

### 【４】デプロイ先URLをOneSignalに設定する
1. OneSignalダッシュボードにアクセス
2. Settings > Platforms > Web
3. Site URLをVercelのURLに更新

### 【５】プッシュ通知を実行する
1. HTTPS環境で通知許可をテスト
2. OneSignalダッシュボードからテスト通知送信

## トラブルシューティング

### 通知が表示されない場合
1. HTTPS環境で実行しているか確認
2. ブラウザの通知設定を確認
3. OneSignalの設定を確認

### コンソールエラーが出る場合
1. OneSignalSDKWorker.jsが正しく配置されているか確認
2. App IDが正しく設定されているか確認
3. ネットワーク接続を確認

## サポート

実装に関する質問や問題がある場合は、Zennの元記事を参照してください：
https://zenn.dev/collabostyle/articles/68b4ec54717604


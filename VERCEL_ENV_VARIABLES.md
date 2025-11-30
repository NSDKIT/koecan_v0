# Vercel環境変数の設定方法

## LINE連携に必要な環境変数

Vercel Dashboard → Settings → Environment Variables で以下を設定してください。

### 必須環境変数

#### 1. Supabase関連

```
NEXT_PUBLIC_SUPABASE_URL
```
- **説明**: SupabaseプロジェクトのURL
- **取得方法**: Supabase Dashboard → Settings → API → Project URL
- **例**: `https://xxxxxxxxxxxxx.supabase.co`

```
SUPABASE_SERVICE_ROLE_KEY
```
- **説明**: SupabaseのService Role Key（サーバーサイド専用）
- **重要**: `NEXT_PUBLIC_`プレフィックスは**付けない**（クライアントに公開されない）
- **取得方法**: Supabase Dashboard → Settings → API → `service_role` key
- **注意**: このキーは機密情報です。クライアント側のコードに含めないでください

#### 2. LINE OAuth関連

```
NEXT_PUBLIC_LINE_CLIENT_ID
```
- **説明**: LINE Login Channel ID
- **取得方法**: [LINE Developers Console](https://developers.line.biz/console/) → チャネル選択 → Basic settings → Channel ID

```
LINE_CLIENT_SECRET
```
- **説明**: LINE Login Channel Secret
- **重要**: `NEXT_PUBLIC_`プレフィックスは**付けない**（クライアントに公開されない）
- **取得方法**: [LINE Developers Console](https://developers.line.biz/console/) → チャネル選択 → Basic settings → Channel secret

```
NEXT_PUBLIC_LINE_REDIRECT_URI
```
- **説明**: LINE OAuthのリダイレクトURI
- **例**: `https://koecan-v0-9kbd.vercel.app/api/line/callback`
- **注意**: LINE Developers ConsoleのCallback URLと一致させる必要があります

#### 3. LINE Messaging API関連（通知送信用）

```
LINE_CHANNEL_ACCESS_TOKEN
```
- **説明**: LINE Messaging APIのアクセストークン
- **重要**: `NEXT_PUBLIC_`プレフィックスは**付けない**（クライアントに公開されない）
- **取得方法**: [LINE Developers Console](https://developers.line.biz/console/) → チャネル選択 → Messaging API → Channel access token

## 環境変数の設定手順

### 1. Vercel Dashboardで設定

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. 「Settings」タブをクリック
4. 「Environment Variables」をクリック
5. 各環境変数を追加：
   - **Key**: 環境変数名（例: `NEXT_PUBLIC_SUPABASE_URL`）
   - **Value**: 環境変数の値
   - **Environment**: 適用する環境（Production, Preview, Development）
6. 「Save」をクリック

### 2. 再デプロイ

環境変数を追加・変更した後は、**再デプロイが必要**です：

1. Vercel Dashboard → Deployments
2. 最新のデプロイメントの「...」メニューをクリック
3. 「Redeploy」を選択

または、GitHubにプッシュすると自動的に再デプロイされます。

## 環境変数の確認方法

### 1. Vercel Dashboardで確認

Vercel Dashboard → Settings → Environment Variables で、設定した環境変数が表示されます。

### 2. ビルドログで確認

Vercel Dashboard → Deployments → 最新のデプロイメント → 「Build Logs」で、環境変数が正しく読み込まれているか確認できます。

**注意**: セキュリティのため、`SUPABASE_SERVICE_ROLE_KEY`や`LINE_CLIENT_SECRET`などの機密情報はログに表示されません。

### 3. アプリケーションで確認

ブラウザの開発者ツール（F12）→ Console で、以下のように確認できます：

```javascript
// クライアント側で確認可能（NEXT_PUBLIC_プレフィックス付き）
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('LINE Client ID:', process.env.NEXT_PUBLIC_LINE_CLIENT_ID);

// サーバー側専用（NEXT_PUBLIC_プレフィックスなし）は確認不可
// これらはAPIルートでのみ使用可能
```

## よくある問題

### 問題1: 「Supabase環境変数が設定されていません」

**原因**:
- `NEXT_PUBLIC_SUPABASE_URL`または`SUPABASE_SERVICE_ROLE_KEY`が設定されていない
- 環境変数名のタイプミス
- 再デプロイしていない

**解決方法**:
1. Vercel Dashboardで環境変数が正しく設定されているか確認
2. 環境変数名にタイプミスがないか確認
3. 再デプロイを実行

### 問題2: 「LINE OAuth環境変数が設定されていません」

**原因**:
- `NEXT_PUBLIC_LINE_CLIENT_ID`、`LINE_CLIENT_SECRET`、`NEXT_PUBLIC_LINE_REDIRECT_URI`のいずれかが設定されていない

**解決方法**:
1. すべてのLINE OAuth関連の環境変数が設定されているか確認
2. 環境変数名にタイプミスがないか確認
3. 再デプロイを実行

### 問題3: 環境変数が読み込まれない

**原因**:
- 環境変数を追加した後に再デプロイしていない
- 環境変数名に`NEXT_PUBLIC_`プレフィックスが必要なのに付けていない（または逆）

**解決方法**:
1. 環境変数を追加・変更した後は必ず再デプロイ
2. クライアント側で使用する場合は`NEXT_PUBLIC_`プレフィックスを付ける
3. サーバー側専用の場合は`NEXT_PUBLIC_`プレフィックスを**付けない**

## セキュリティに関する注意事項

### 機密情報の取り扱い

以下の環境変数は**絶対に**`NEXT_PUBLIC_`プレフィックスを付けないでください：

- `SUPABASE_SERVICE_ROLE_KEY` - データベースへの完全アクセス権限
- `LINE_CLIENT_SECRET` - LINE OAuthのシークレット
- `LINE_CHANNEL_ACCESS_TOKEN` - LINE Messaging APIのアクセストークン

これらがクライアント側に公開されると、セキュリティリスクが発生します。

### 環境変数の管理

- 本番環境と開発環境で異なる値を設定する場合は、Environment（Production, Preview, Development）を適切に選択
- 機密情報はGitHubにコミットしない（`.env.local`は`.gitignore`に含まれていることを確認）


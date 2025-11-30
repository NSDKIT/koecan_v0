# LINE認証リダイレクトURI不一致エラーの修正方法

## エラー内容

```
ERROR: トークン交換失敗。Result: {"error":"invalid_grant","error_description":"invalid authorization code"}
```

## 原因

LINE OAuthでは、以下の3つのリダイレクトURIが**完全に一致**している必要があります：

1. **LINE認証URL生成時** (`LineLinkButton.tsx`)
2. **トークン交換時** (GASの`doGet`関数)
3. **LINE Developers Consoleに登録されているリダイレクトURI**

現在、これらのURIが一致していない可能性があります。

## 確認手順

### 1. 環境変数の確認

`NEXT_PUBLIC_LINE_REDIRECT_URI`がGASのURLに設定されているか確認：

```bash
# 環境変数を確認（Vercelの場合）
# Vercel Dashboard → Settings → Environment Variables
```

**正しい値の例**:
```
https://script.google.com/macros/s/AKfycbzWc5WP2ZOI1zAQGQpNM82H311XUqkbl5rxCSWYhS-ntU55MvuycCQ7kvSeLDSBpvDbeA/exec
```

### 2. LINE Developers Consoleの確認

1. [LINE Developers Console](https://developers.line.biz/console/)にログイン
2. 該当のチャネルを選択
3. 「LINE Login」タブを開く
4. 「Callback URL」を確認

**重要**: 登録されているCallback URLが、`NEXT_PUBLIC_LINE_REDIRECT_URI`と完全に一致している必要があります。

### 3. GASコードの確認

GASコードでは、`ScriptApp.getService().getUrl()`を使用しています：

```javascript
const redirectUri = ScriptApp.getService().getUrl();
```

この値が、`NEXT_PUBLIC_LINE_REDIRECT_URI`と一致しているか確認してください。

## 修正方法

### 方法1: 環境変数をGASのURLに設定（推奨）

1. **GASのWebアプリURLを取得**:
   - GASエディタで「デプロイ」→「ウェブアプリ」を選択
   - 「ウェブアプリのURL」をコピー

2. **環境変数を設定**:
   - Vercel Dashboard → Settings → Environment Variables
   - `NEXT_PUBLIC_LINE_REDIRECT_URI`をGASのURLに設定

3. **LINE Developers Consoleに登録**:
   - Callback URLにGASのURLを登録（まだ登録されていない場合）

### 方法2: GASコードを修正して環境変数を使用

GASコードを修正して、環境変数からリダイレクトURIを取得するように変更：

```javascript
// GASコード内
const APP_BASE_URL = props.getProperty('APP_BASE_URL');
const LINE_REDIRECT_URI = props.getProperty('LINE_REDIRECT_URI'); // 新規追加

// doGet関数内
const redirectUri = LINE_REDIRECT_URI || ScriptApp.getService().getUrl();
```

**GASスクリプトプロパティに追加**:
- `LINE_REDIRECT_URI`: GASのWebアプリURL

### 方法3: Next.js APIルートに統一（長期的な解決策）

GASへの依存を減らすため、Next.js APIルートに統一：

1. **環境変数をNext.js APIルートに設定**:
   ```
   NEXT_PUBLIC_LINE_REDIRECT_URI=https://koecan-v0-9kbd.vercel.app/api/line/callback
   ```

2. **LINE Developers Consoleに登録**:
   - Callback URLにNext.js APIルートのURLを登録

3. **GASの`doGet`関数は残す**:
   - 他の機能（アンケート通知、チャット通知など）で使用している可能性があるため

## デバッグ方法

### GASログで確認

GASコードにデバッグログを追加：

```javascript
function doGet(e) {
  const redirectUri = ScriptApp.getService().getUrl();
  Logger.log('DEBUG: GAS Redirect URI: ' + redirectUri);
  Logger.log('DEBUG: Received redirect_uri from LINE: ' + e.parameter.redirect_uri);
  
  // ... 既存のコード
}
```

### ブラウザのコンソールで確認

`LineLinkButton.tsx`のコンソールログを確認：

```javascript
console.log('Redirect URI:', LINE_REDIRECT_URI);
```

この値が、GASのURLと一致しているか確認してください。

## よくある間違い

### ❌ 間違い1: URLの末尾が異なる

```
認証URL生成時: https://script.google.com/.../exec
トークン交換時: https://script.google.com/.../exec/
```
→ 末尾の`/`の有無で不一致になる

### ❌ 間違い2: エンコーディングの違い

```
認証URL生成時: https://script.google.com/.../exec (エンコードなし)
トークン交換時: https%3A%2F%2Fscript.google.com%2F...%2Fexec (エンコード済み)
```
→ トークン交換時はエンコード不要（LINE APIが自動処理）

### ❌ 間違い3: 開発環境と本番環境の違い

```
開発環境: http://localhost:3000/api/line/callback
本番環境: https://koecan-v0-9kbd.vercel.app/api/line/callback
```
→ 環境ごとに正しいURLを設定する必要がある

## 確認チェックリスト

- [ ] `NEXT_PUBLIC_LINE_REDIRECT_URI`がGASのURLに設定されている
- [ ] LINE Developers ConsoleのCallback URLが同じURLに登録されている
- [ ] GASの`ScriptApp.getService().getUrl()`が同じURLを返している
- [ ] 認証URL生成時とトークン交換時のリダイレクトURIが完全に一致している
- [ ] URLの末尾に`/`がない（または両方にある）
- [ ] 環境変数が正しくデプロイされている（Vercelの場合、再デプロイが必要）

## 次のステップ

1. 上記のチェックリストを確認
2. 環境変数を修正
3. LINE Developers ConsoleのCallback URLを確認・修正
4. 再度LINE連携を試す
5. GASログでエラーが解消されたか確認


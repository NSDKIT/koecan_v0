# リダイレクトURIの確認方法

## 1. 認証URL生成時のリダイレクトURI

### 場所
**ファイル**: `components/LineLinkButton.tsx`

### コード
```typescript
// 13行目: 環境変数から取得
const LINE_REDIRECT_URI = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || 'YOUR_REDIRECT_URI';

// 60行目: エンコードして使用
const encodedRedirectUri = encodeURIComponent(LINE_REDIRECT_URI);

// 67行目: LINE認証URLに含める
const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${LINE_CLIENT_ID}` +
    `&redirect_uri=${encodedRedirectUri}` +  // ← ここで使用
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&state=${encodeURIComponent(encodedState)}` +
    `&prompt=${PROMPT}`;
```

### 確認方法

#### 方法1: ブラウザのコンソールログで確認
1. LINE連携ボタンをクリックする前
2. ブラウザの開発者ツールを開く（F12）
3. 「Console」タブを選択
4. LINE連携ボタンをクリック
5. 以下のログが表示されます：
   ```
   Redirect URI: https://script.google.com/macros/s/.../exec
   LINE認証URL: https://access.line.me/oauth2/v2.1/authorize?...
   ```
   - `Redirect URI:` の後に表示される値が、認証URL生成時に使用されるリダイレクトURIです

#### 方法2: 環境変数を直接確認
1. **Vercelの場合**:
   - Vercel Dashboard → プロジェクト選択 → Settings → Environment Variables
   - `NEXT_PUBLIC_LINE_REDIRECT_URI` の値を確認

2. **ローカル開発の場合**:
   - `.env.local` ファイルを開く
   - `NEXT_PUBLIC_LINE_REDIRECT_URI` の値を確認

#### 方法3: コードに一時的にログを追加
```typescript
// LineLinkButton.tsx の handleLineLink 関数内
console.log('=== 認証URL生成時のリダイレクトURI ===');
console.log('環境変数 LINE_REDIRECT_URI:', LINE_REDIRECT_URI);
console.log('エンコード後:', encodedRedirectUri);
console.log('====================================');
```

---

## 2. トークン交換時（GAS）のリダイレクトURI

### 場所
**GASコード**（提供されたコード内）

### コード
```javascript
// GASコード内（doGet関数の最初）
const redirectUri = ScriptApp.getService().getUrl();
Logger.log('DEBUG: ScriptApp.getService().getUrl() value: ' + redirectUri);

// トークン交換時に使用（LINE APIへのリクエスト）
const tokenPayloadString = 
    `grant_type=authorization_code` +
    `&code=${encodeURIComponent(code)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +  // ← ここで使用
    `&client_id=${encodeURIComponent(LINE_CHANNEL_ID)}` +
    `&client_secret=${encodeURIComponent(LINE_CHANNEL_SECRET)}`;
```

### 確認方法

#### 方法1: GASの実行ログで確認（最も確実）
1. GASエディタを開く
2. 「実行」→「doGet」を選択
3. または、実際にLINE連携を試行した後のログを確認
4. ログに以下のような行が表示されます：
   ```
   DEBUG: ScriptApp.getService().getUrl() value: https://script.google.com/macros/s/AKfycbzWc5WP2ZOI1zAQGQpNM82H311XUqkbl5rxCSWYhS-ntU55MvuycCQ7kvSeLDSBpvDbeA/exec
   ```
   - この値が、トークン交換時に使用されるリダイレクトURIです

#### 方法2: GASエディタで確認
1. GASエディタを開く
2. 「デプロイ」→「ウェブアプリ」を選択
3. 「ウェブアプリのURL」を確認
   - このURLが、`ScriptApp.getService().getUrl()` が返す値です

#### 方法3: GASコードにログを追加
```javascript
function doGet(e) {
  const redirectUri = ScriptApp.getService().getUrl();
  
  // デバッグログを追加
  Logger.log('=== トークン交換時のリダイレクトURI ===');
  Logger.log('ScriptApp.getService().getUrl(): ' + redirectUri);
  Logger.log('====================================');
  
  // ... 既存のコード
}
```

---

## 3. 比較と確認

### 確認すべき3つのURI

1. **認証URL生成時** (`LineLinkButton.tsx`)
   - 値: `NEXT_PUBLIC_LINE_REDIRECT_URI` 環境変数
   - 確認方法: ブラウザのコンソールログ

2. **トークン交換時** (GAS)
   - 値: `ScriptApp.getService().getUrl()`
   - 確認方法: GASの実行ログ

3. **LINE Developers Consoleに登録されているCallback URL**
   - 確認方法: [LINE Developers Console](https://developers.line.biz/console/) → チャネル選択 → 「LINE Login」タブ → 「Callback URL」

### 重要: 3つすべてが完全に一致している必要があります

**例**:
```
✅ 正しい場合:
認証URL生成時: https://script.google.com/macros/s/.../exec
トークン交換時: https://script.google.com/macros/s/.../exec
LINE Developers Console: https://script.google.com/macros/s/.../exec

❌ 間違っている場合:
認証URL生成時: https://script.google.com/macros/s/.../exec
トークン交換時: https://script.google.com/macros/s/.../exec/
LINE Developers Console: https://script.google.com/macros/s/.../exec
（末尾の / の有無で不一致）
```

---

## 4. 実際の確認手順

### ステップ1: 認証URL生成時のURIを確認
1. ブラウザの開発者ツールを開く
2. LINE連携ボタンをクリック
3. コンソールに表示される `Redirect URI:` の値をメモ

### ステップ2: トークン交換時のURIを確認
1. GASエディタを開く
2. 実行ログを確認
3. `DEBUG: ScriptApp.getService().getUrl() value:` の後の値をメモ

### ステップ3: LINE Developers Consoleを確認
1. [LINE Developers Console](https://developers.line.biz/console/)にログイン
2. 該当チャネルを選択
3. 「LINE Login」タブを開く
4. 「Callback URL」の値をメモ

### ステップ4: 比較
3つの値を比較して、完全に一致しているか確認

---

## 5. トラブルシューティング

### 問題: 値が一致しない

#### ケース1: 認証URL生成時とトークン交換時が異なる
**原因**: 環境変数 `NEXT_PUBLIC_LINE_REDIRECT_URI` が、GASのURLと異なる値に設定されている

**解決方法**:
1. Vercel Dashboard → Settings → Environment Variables
2. `NEXT_PUBLIC_LINE_REDIRECT_URI` を、GASの `ScriptApp.getService().getUrl()` が返す値に設定
3. 再デプロイ

#### ケース2: LINE Developers Consoleと異なる
**原因**: LINE Developers Consoleに登録されているCallback URLが、実際に使用されているURLと異なる

**解決方法**:
1. LINE Developers Console → チャネル選択 → 「LINE Login」タブ
2. 「Callback URL」に、GASのURLを登録（または既存のURLを修正）
3. 保存

#### ケース3: 末尾の `/` の有無で不一致
**原因**: URLの末尾に `/` がある場合とない場合で不一致

**解決方法**:
- すべての場所で、末尾に `/` を付けない（または付ける）ように統一

---

## 6. デバッグ用コード

### LineLinkButton.tsx に追加
```typescript
// handleLineLink 関数内、lineAuthUrl 生成の後
console.log('=== 認証URL生成時のリダイレクトURI ===');
console.log('環境変数:', LINE_REDIRECT_URI);
console.log('エンコード後:', encodedRedirectUri);
console.log('完全な認証URL:', lineAuthUrl);
console.log('====================================');
```

### GASコードに追加
```javascript
function doGet(e) {
  const redirectUri = ScriptApp.getService().getUrl();
  
  Logger.log('=== トークン交換時のリダイレクトURI ===');
  Logger.log('ScriptApp.getService().getUrl(): ' + redirectUri);
  Logger.log('====================================');
  
  // ... 既存のコード（トークン交換部分）
  
  Logger.log('=== トークン交換リクエスト ===');
  Logger.log('redirect_uri: ' + encodeURIComponent(redirectUri));
  Logger.log('完全なリクエストボディ: ' + tokenPayloadString);
  Logger.log('====================================');
}
```

これらのログを確認することで、どの段階でURIが異なっているかを特定できます。


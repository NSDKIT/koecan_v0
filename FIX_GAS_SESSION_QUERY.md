# GASコードのセッション取得部分の修正

## 問題

GASログを見ると：
- `Session Fetch Response Code: 200` - リクエストは成功
- `Session Data: []` - データが空配列

これは、URLパラメータが正しくエンコードされていない可能性があります。

## 修正箇所

GASコードの以下の部分を修正してください：

### 修正前（現在のコード）

```javascript
// 4. ★★★ Supabaseからトークンに紐づくユーザーIDを取得 ★★★
const sessionUrl = SUPABASE_URL + `/rest/v1/line_link_sessions?select=user_id,expires_at&token=eq.${tempToken}`;
```

### 修正後

```javascript
// 4. ★★★ Supabaseからトークンに紐づくユーザーIDを取得 ★★★
// tempTokenをURLエンコード（UUID形式でも念のためエンコード）
const encodedToken = encodeURIComponent(tempToken);
const sessionUrl = SUPABASE_URL + `/rest/v1/line_link_sessions?select=user_id,expires_at&token=eq.${encodedToken}`;

Logger.log('Session Fetch URL: ' + sessionUrl);
Logger.log('Token (original): ' + tempToken);
Logger.log('Token (encoded): ' + encodedToken);
```

## 完全な修正版コード

```javascript
// 4. ★★★ Supabaseからトークンに紐づくユーザーIDを取得 ★★★
// tempTokenをURLエンコード（UUID形式でも念のためエンコード）
const encodedToken = encodeURIComponent(tempToken);
const sessionUrl = SUPABASE_URL + `/rest/v1/line_link_sessions?select=user_id,expires_at&token=eq.${encodedToken}`;

Logger.log('Session Fetch URL: ' + sessionUrl);
Logger.log('Token (original): ' + tempToken);
Logger.log('Token (encoded): ' + encodedToken);

const sessionOptions = {
  method: 'GET',
  headers: {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
  },
  muteHttpExceptions: true
};

let appUserId;
try {
  const sessionResponse = UrlFetchApp.fetch(sessionUrl, sessionOptions);
  const sessionCode = sessionResponse.getResponseCode();
  
  Logger.log('Session Fetch Response Code: ' + sessionCode);
  Logger.log('Session Fetch Response Body: ' + sessionResponse.getContentText());
  
  if (sessionCode !== 200) {
    Logger.log('ERROR: セッション取得失敗。Code: ' + sessionCode);
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=session_fetch_failed');
  }
  
  const sessionData = JSON.parse(sessionResponse.getContentText());
  Logger.log('Session Data: ' + JSON.stringify(sessionData));
  
  if (!sessionData || sessionData.length === 0) {
    Logger.log('ERROR: トークンに対応するセッションが見つかりません');
    Logger.log('DEBUG: 検索したトークン: ' + tempToken);
    Logger.log('DEBUG: エンコード後のトークン: ' + encodedToken);
    Logger.log('DEBUG: 使用したURL: ' + sessionUrl);
    
    // デバッグ用: テーブル内の全セッションを確認（最初の10件）
    const debugUrl = SUPABASE_URL + `/rest/v1/line_link_sessions?select=token,user_id,expires_at&limit=10&order=created_at.desc`;
    const debugResponse = UrlFetchApp.fetch(debugUrl, sessionOptions);
    Logger.log('DEBUG: テーブル内のセッション（最新10件）: ' + debugResponse.getContentText());
    
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=invalid_token');
  }
  
  const session = sessionData[0];
  appUserId = session.user_id;
  const expiresAt = new Date(session.expires_at);
  
  Logger.log('User ID取得成功: ' + appUserId);
  Logger.log('Session Expires At: ' + expiresAt);
  
  // 期限チェック
  if (expiresAt < new Date()) {
    Logger.log('ERROR: セッションの期限が切れています');
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=session_expired');
  }
  
  Logger.log('✅ Valid session found for user: ' + appUserId);
  
} catch (err) {
  Logger.log('CRITICAL ERROR: Supabaseからのセッション取得失敗: ' + err);
  Logger.log('Error details: ' + err.toString());
  return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=db_fetch_failed');
}
```

## その他の確認事項

### 1. セッションが正しく保存されているか確認

SupabaseのSQL Editorで以下を実行：

```sql
SELECT 
    token,
    user_id,
    expires_at,
    created_at,
    used_at
FROM 
    line_link_sessions
ORDER BY 
    created_at DESC
LIMIT 10;
```

### 2. トークンの形式を確認

ブラウザのコンソールで、`LineLinkButton.tsx`が生成したトークンと、GASが受け取ったトークンが一致しているか確認してください。

### 3. タイムゾーンの問題

`expires_at`が正しく設定されているか確認してください。JavaScriptの`Date`とSupabaseの`timestamptz`のタイムゾーンが異なる可能性があります。

## デバッグ手順

1. GASコードを修正
2. LINE連携を再度試行
3. GASログで以下を確認：
   - `Session Fetch URL` - 実際に送信されたURL
   - `Token (original)` - 元のトークン
   - `Token (encoded)` - エンコード後のトークン
   - `Session Fetch Response Body` - Supabaseからの応答
   - `DEBUG: テーブル内のセッション` - テーブル内の実際のデータ

これらのログを確認することで、問題の原因を特定できます。


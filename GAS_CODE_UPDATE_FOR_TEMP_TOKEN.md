# GASコードの一時トークン方式への修正方法

## 概要

一時トークン方式を実装するため、GASコードの`doGet`関数を修正する必要があります。

## 修正前のコード（現在）

```javascript
function doGet(e) {
  // stateからuserIdを抽出
  const stateObject = JSON.parse(rawState);
  appUserId = stateObject.userId; // これが user.id
  // ...
}
```

## 修正後のコード

```javascript
function doGet(e) {
  Logger.log('=== doGet(e) STARTED (Using Temp Token) ===');
  
  // 1. 必須プロパティのチェック
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !APP_BASE_URL) {
    Logger.log('FATAL ERROR: One or more required properties are missing!');
    const errorMessage = encodeURIComponent('GAS_CONFIG_MISSING');
    const safeRedirectUrl = (APP_BASE_URL || 'http://localhost:3000') + '?line_link_status=failure&error=' + errorMessage;
    return redirectToApp(safeRedirectUrl);
  }
  
  const params = e.parameter;
  const code = params.code;
  const state = params.state;
  const error = params.error;
  
  Logger.log('Received Code: ' + (code ? 'Exists' : 'MISSING'));
  
  // 2. 認証エラーチェック
  if (error) {
    Logger.log('ERROR: LINE認証が拒否されました。Error: ' + error);
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=' + encodeURIComponent(error));
  }
  
  // 3. stateからトークンを抽出
  let tempToken;
  try {
    // URL-safe base64デコード（- → +, _ → /, パディング追加）
    let stateBase64 = state.replace(/-/g, '+').replace(/_/g, '/');
    // パディングを追加（必要に応じて）
    while (stateBase64.length % 4) {
      stateBase64 += '=';
    }
    const rawState = Utilities.newBlob(Utilities.base64Decode(stateBase64, Utilities.Charset.UTF_8)).getDataAsString();
    const stateObject = JSON.parse(rawState);
    tempToken = stateObject.token;
    Logger.log('State Decoded Successfully. Token: ' + tempToken.substring(0, 8) + '...');
  } catch (err) {
    Logger.log('ERROR: Stateデコード/検証中に失敗: ' + err);
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=state_mismatch');
  }
  
  if (!tempToken) {
    Logger.log('ERROR: Stateデコードから tempToken が抽出できませんでした。');
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=token_missing');
  }
  
  // 4. 一時トークンからユーザーIDを取得（Supabaseから）
  let appUserId;
  try {
    const sessionUrl = SUPABASE_URL + '/rest/v1/line_link_sessions?select=user_id,expires_at&token=eq.' + tempToken + '&expires_at=gt.' + new Date().toISOString();
    
    const sessionOptions = {
      'method': 'get',
      'headers': {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
      },
      'muteHttpExceptions': true
    };
    
    const sessionResponse = UrlFetchApp.fetch(sessionUrl, sessionOptions);
    const sessionCode = sessionResponse.getResponseCode();
    
    if (sessionCode !== 200) {
      Logger.log('ERROR: セッション取得失敗。Code: ' + sessionCode + ', Body: ' + sessionResponse.getContentText());
      return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=session_not_found');
    }
    
    const sessionData = JSON.parse(sessionResponse.getContentText());
    
    if (!sessionData || sessionData.length === 0) {
      Logger.log('ERROR: セッションが見つかりません（期限切れまたは無効）');
      return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=session_expired');
    }
    
    appUserId = sessionData[0].user_id;
    Logger.log('Step 4: User ID取得成功: ' + appUserId);
    
    // セッションを使用済みとしてマーク（オプション）
    const updateUrl = SUPABASE_URL + '/rest/v1/line_link_sessions?token=eq.' + tempToken;
    const updateOptions = {
      'method': 'patch',
      'headers': {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      'payload': JSON.stringify({
        used_at: new Date().toISOString()
      }),
      'muteHttpExceptions': true
    };
    UrlFetchApp.fetch(updateUrl, updateOptions); // エラーは無視（ログのみ）
    
  } catch (err) {
    Logger.log('CRITICAL ERROR: セッション取得中にエラー: ' + err);
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=session_fetch_error');
  }
  
  if (!appUserId) {
    Logger.log('ERROR: ユーザーIDが取得できませんでした。');
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=user_id_not_found');
  }
  
  // 5. トークン交換（既存のコード）
  const redirectUri = ScriptApp.getService().getUrl();
  Logger.log('DEBUG: ScriptApp.getService().getUrl() value: ' + redirectUri);
  
  const tokenApiUrl = 'https://api.line.me/oauth2/v2.1/token';
  const tokenPayloadString = 
    `grant_type=authorization_code` +
    `&code=${encodeURIComponent(code)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_id=${encodeURIComponent(LINE_CHANNEL_ID)}` +
    `&client_secret=${encodeURIComponent(LINE_CHANNEL_SECRET)}`;
  
  Logger.log('Step 5: Sending Token Exchange POST request to LINE...');
  const tokenOptions = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    'payload': tokenPayloadString,
    'muteHttpExceptions': true
  };
  
  let tokenResponse;
  try {
    tokenResponse = UrlFetchApp.fetch(tokenApiUrl, tokenOptions);
    const responseText = tokenResponse.getContentText();
    const tokenResult = JSON.parse(responseText);
    
    Logger.log('LINE Token API Response Code: ' + tokenResponse.getResponseCode());
    
    if (tokenResult.error) {
      Logger.log('ERROR: トークン交換失敗。Result: ' + JSON.stringify(tokenResult));
      const lineError = tokenResult.error_description || tokenResult.error;
      return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=' + encodeURIComponent('Token_Exchange_Failed: ' + lineError));
    }
    
    // 6. IDトークンの検証とID抽出（既存のコード）
    const idToken = tokenResult.id_token;
    
    const payloadBase64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadLength = payloadBase64.length;
    const padding = (4 - (payloadLength % 4)) % 4;
    const paddedPayloadBase64 = payloadBase64 + '==='.slice(0, padding);
    const rawPayload = Utilities.newBlob(Utilities.base64Decode(paddedPayloadBase64, Utilities.Charset.UTF_8)).getDataAsString();
    const idTokenPayload = JSON.parse(rawPayload);
    
    const lineUserId = idTokenPayload.sub; // LINE User ID
    
    Logger.log('Step 6: ID Token Decoded. LineUserId (sub): ' + lineUserId);
    
    if (!lineUserId) {
      Logger.log('ERROR: IDトークンから LINE User ID が抽出できませんでした。');
      return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=line_id_not_found');
    }
    
    // 7. Supabase DBに紐付けを登録（既存のコード）
    const dbPayload = {
      user_id: appUserId,
      line_user_id: lineUserId
    };
    
    const dbOptions = {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
      },
      payload: JSON.stringify(dbPayload),
      muteHttpExceptions: true
    };
    
    const dbUrl = SUPABASE_URL + '/rest/v1/user_line_links';
    const dbResponse = UrlFetchApp.fetch(dbUrl, dbOptions);
    const dbCode = dbResponse.getResponseCode();
    
    // 409: Conflict (UNIQUE制約違反 = 既に登録済み) の場合も成功とみなす
    if (dbCode >= 400 && dbCode !== 409) { 
       Logger.log('ERROR: DB登録失敗。Code: ' + dbCode + ', Body: ' + dbResponse.getContentText());
       return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=db_link_failed');
    }
    
    // 8. 成功リダイレクト
    Logger.log('Step 7: DB registration successful (Code: ' + dbCode + ').');
    return redirectToApp(APP_BASE_URL + '?line_link_status=success');
    
  } catch (err) {
    Logger.log('CRITICAL ERROR: GAS処理全体で予期せぬエラー発生: ' + err);
    return redirectToApp(APP_BASE_URL + '?line_link_status=failure&error=internal_gas_error');
  }
}
```

## 主な変更点

1. **stateのデコード方法を変更**
   - 以前: `userId`を直接取得
   - 現在: `token`を取得し、Supabaseから`user_id`を取得

2. **一時トークンの検証を追加**
   - Supabaseの`line_link_sessions`テーブルからトークンを検証
   - 有効期限をチェック
   - トークンから`user_id`を取得

3. **セッションの使用済みマーク（オプション）**
   - トークン使用後に`used_at`を更新（再利用防止）

## セキュリティ上の利点

1. **ユーザーIDの直接暴露を防止**
   - `state`パラメータに`user.id`を含めない
   - 一時トークンのみを含める

2. **有効期限の管理**
   - 10分後に自動的に期限切れ
   - 期限切れトークンは無効

3. **再利用防止**
   - 使用済みトークンは`used_at`でマーク（オプション）

## 注意事項

1. **SupabaseのRLSポリシー**
   - `line_link_sessions`テーブルに`service_role`のアクセス権限が必要
   - `create_line_link_sessions_table.sql`で設定済み

2. **エラーハンドリング**
   - セッションが見つからない場合、期限切れの場合、無効な場合を適切に処理

3. **ログ出力**
   - デバッグ用のログを追加（本番環境では削除推奨）

## テスト手順

1. `create_line_link_sessions_table.sql`をSupabaseで実行
2. `LineLinkButton.tsx`を更新（完了）
3. GASコードを上記のコードに置き換え
4. LINE連携をテスト
5. GASログでエラーがないか確認
6. Supabaseの`line_link_sessions`テーブルでトークンが正しく保存・使用されているか確認


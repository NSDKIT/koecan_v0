# LINE連携アーキテクチャの説明

## 現在の実装状況

### 2つの実装が存在

1. **GAS実装** (`doGet`関数)
   - リダイレクトURI: GASのWebアプリURL
   - 処理フロー: LINE認証 → GAS → Supabase保存 → アプリにリダイレクト
   - 使用条件: `NEXT_PUBLIC_LINE_REDIRECT_URI`がGASのURLに設定されている場合

2. **Next.js APIルート実装** (`app/api/line/callback/route.ts`)
   - リダイレクトURI: `/api/line/callback`
   - 処理フロー: LINE認証 → Next.js API → Supabase保存 → アプリにリダイレクト
   - 使用条件: `NEXT_PUBLIC_LINE_REDIRECT_URI`がNext.js APIルートに設定されている場合

## どちらが使用されているか？

**環境変数 `NEXT_PUBLIC_LINE_REDIRECT_URI` の値によって決まります：**

- GASのURL（例: `https://script.google.com/macros/s/.../exec`）→ **GASが処理**
- Next.js APIルート（例: `https://your-domain.com/api/line/callback`）→ **Next.js APIルートが処理**

## GAS実装の詳細

### `doGet`関数の処理フロー

1. **stateパラメータから`appUserId`を抽出**
   ```javascript
   const stateObject = JSON.parse(rawState);
   appUserId = stateObject.userId; // これが user.id
   ```

2. **LINE OAuthでトークン交換**
   - `code`を`access_token`と`id_token`に交換

3. **IDトークンから`lineUserId`を抽出**
   ```javascript
   const lineUserId = idTokenPayload.sub; // LINE User ID
   ```

4. **Supabaseに保存**
   ```javascript
   const dbPayload = {
     user_id: appUserId,      // user.idと同じ値
     line_user_id: lineUserId  // LINE User ID
   };
   ```

5. **リダイレクト**
   ```javascript
   return redirectToApp(APP_BASE_URL + '?line_link_status=success');
   ```

## 重要なポイント

### `user.id`と`user_line_links.user_id`の関係

- **`user.id`**: Supabase認証のユーザーID（`users`テーブルの`id`）
- **`user_line_links.user_id`**: 同じユーザーID（`user.id`と同じ値であるべき）
- **`user_line_links.line_user_id`**: LINEのユーザーID（LINE側のID）

**結論**: `user.id`と`user_line_links.user_id`は**同じ値**です。別のIDではありません。

### GAS実装での保存方法

GASコードでは、`POST`メソッドで`Prefer: resolution=merge-duplicates`ヘッダーを使用しています：

```javascript
const dbOptions = {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',  // 重複時は更新
    'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
  },
  payload: JSON.stringify(dbPayload),
};
```

これは`UPSERT`操作に相当しますが、`user_id`がPRIMARY KEYの場合、既存レコードがあれば更新されます。

## 確認方法

### 1. 環境変数の確認

```bash
# どのリダイレクトURIが設定されているか確認
echo $NEXT_PUBLIC_LINE_REDIRECT_URI
```

### 2. データベースの確認

`check_user_id_relationship.sql`を実行して、`user.id`と`user_line_links.user_id`が一致しているか確認：

```sql
SELECT 
    ull.user_id AS "user_line_links.user_id",
    auth.uid() AS "user.id (auth.uid())",
    CASE 
        WHEN ull.user_id = auth.uid() THEN '✅ 一致'
        ELSE '❌ 不一致'
    END AS "一致確認",
    ull.line_user_id AS "LINEユーザーID"
FROM 
    user_line_links ull
WHERE 
    ull.user_id = auth.uid();
```

### 3. GASログの確認

GASの実行ログを確認して、`appUserId`が正しく抽出されているか確認：

```
State Decoded Successfully.
Step 5: ID Token Decoded. LineUserId (sub): ...
Step 6: DB registration successful (Code: ...).
```

## トラブルシューティング

### 問題: LINE連携済みと表示されない

**原因の可能性**:
1. GASが`user_id`を正しく保存していない
2. `state`パラメータのデコードに失敗している
3. RLSポリシーでデータが取得できない

**確認方法**:
1. GASの実行ログを確認
2. `check_user_id_relationship.sql`を実行
3. `debug_line_link_issue.sql`を実行してRLSポリシーを確認

### 問題: 重複エラー（409 Conflict）

**原因**: `user_id`が既に存在しているが、`UNIQUE`制約違反

**解決方法**: GASコードでは既に409エラーを成功として扱っています：

```javascript
// 409: Conflict (UNIQUE制約違反 = 既に登録済み) の場合も成功とみなす
if (dbCode >= 400 && dbCode !== 409) {
   // エラー処理
}
```

## 推奨事項

### どちらの実装を使うべきか？

**GAS実装を使用する場合**:
- ✅ 既存のGASコードが動作している
- ✅ 他の機能（アンケート通知、チャット通知など）もGASで処理している
- ✅ GASのログ機能を活用したい

**Next.js APIルート実装を使用する場合**:
- ✅ すべての処理をNext.jsに統一したい
- ✅ GASへの依存を減らしたい
- ✅ デプロイと管理を簡素化したい

### 統一する場合の手順

1. **GASを削除する場合**:
   - `NEXT_PUBLIC_LINE_REDIRECT_URI`をNext.js APIルートに変更
   - LINE Developers ConsoleでリダイレクトURIを更新
   - GASの`doGet`関数は残しておく（他の機能で使用している可能性があるため）

2. **Next.js APIルートを削除する場合**:
   - `app/api/line/callback/route.ts`を削除
   - `NEXT_PUBLIC_LINE_REDIRECT_URI`がGASのURLであることを確認


# 「セッションが見つかりません」エラーのトラブルシューティング

## エラーの原因

「セッションが見つかりません」エラーは、`line_link_sessions`テーブルから一時トークンでセッションを取得できない場合に発生します。

## 確認手順

### 1. テーブルが存在するか確認

SupabaseのSQL Editorで以下を実行：

```sql
-- テーブルの存在確認
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name = 'line_link_sessions';
```

**結果が空の場合**: `create_line_link_sessions_table.sql`を実行してテーブルを作成してください。

### 2. セッションが正しく保存されているか確認

ブラウザの開発者ツール（F12）→ Console で、LINE連携ボタンをクリックした際のログを確認：

```
セッション作成を試行中... { token: 'xxxxxxxx...', userId: '...', expiresAt: '...' }
セッション作成成功: [...]
```

**「セッション作成失敗」が表示される場合**: RLSポリシーの問題の可能性があります。`fix_line_link_sessions_rls.sql`を実行してください。

### 3. RLSポリシーを確認

SupabaseのSQL Editorで以下を実行：

```sql
-- RLSポリシーの確認
SELECT
    policyname AS "ポリシー名",
    cmd AS "操作",
    roles AS "ロール",
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'line_link_sessions'
ORDER BY
    policyname;
```

**必須ポリシー**:
- `Service role can manage all line link sessions` (ALL, service_role) - **これが重要**
- `Users can insert own line link sessions` (INSERT, authenticated)
- `Users can view own line link sessions` (SELECT, authenticated)

**`Service role can manage all line link sessions`が存在しない場合**: `fix_line_link_sessions_rls.sql`を実行してください。

### 4. テーブル内のデータを確認

SupabaseのSQL Editorで以下を実行（管理者権限が必要）：

```sql
-- 最新のセッションデータを確認
SELECT 
    id,
    token,
    user_id,
    expires_at,
    created_at,
    used_at,
    CASE 
        WHEN expires_at < now() THEN '❌ 期限切れ'
        ELSE '✅ 有効'
    END AS status
FROM 
    line_link_sessions
ORDER BY 
    created_at DESC
LIMIT 10;
```

**データが存在しない場合**: セッションが正しく保存されていない可能性があります。RLSポリシーを確認してください。

### 5. Vercelのログで確認

Vercel Dashboard → Deployments → 最新のデプロイメント → Functions → `/api/line/callback` のログを確認：

```
セッション検索開始: { token: 'xxxxxxxx...', tokenLength: 36 }
セッション検索結果: { hasData: false, hasError: true, error: {...} }
```

**エラーコードの確認**:
- `PGRST116`: データが見つからない（テーブルが存在しないか、データがありません）
- `42501`: RLSポリシーエラー（権限がありません）

## よくある原因と解決方法

### 原因1: テーブルが存在しない

**症状**: エラーコード `42P01` または `PGRST116`

**解決方法**:
1. SupabaseのSQL Editorで`create_line_link_sessions_table.sql`を実行
2. テーブルが作成されたことを確認
3. LINE連携を再度試行

### 原因2: RLSポリシーが正しく設定されていない

**症状**: エラーコード `42501` または セッション作成時にエラー

**解決方法**:
1. SupabaseのSQL Editorで`fix_line_link_sessions_rls.sql`を実行
2. 特に`Service role can manage all line link sessions`ポリシーが存在することを確認
3. LINE連携を再度試行

### 原因3: セッションが期限切れ

**症状**: 「セッションの期限が切れています」エラー

**解決方法**:
- セッションの有効期限は10分です
- LINE連携ボタンをクリックしてから10分以内にLINE認証を完了してください
- 時間がかかる場合は、再度LINE連携ボタンをクリックしてください

### 原因4: トークンの不一致

**症状**: セッション検索結果が空

**確認方法**:
1. ブラウザのコンソールで、セッション作成時のトークンを確認
2. Vercelのログで、セッション検索時のトークンを確認
3. 両者が一致しているか確認

**解決方法**:
- `state`パラメータのエンコード/デコードが正しく行われているか確認
- URL-safe base64エンコードが正しく行われているか確認

### 原因5: Service Role Keyが正しく設定されていない

**症状**: RLSポリシーエラーが発生する

**確認方法**:
- Vercel Dashboard → Settings → Environment Variables
- `SUPABASE_SERVICE_ROLE_KEY`が正しく設定されているか確認

**解決方法**:
1. Supabase Dashboard → Settings → API → `service_role` key をコピー
2. Vercel Dashboardで`SUPABASE_SERVICE_ROLE_KEY`を設定
3. 再デプロイ

## デバッグ用SQL

問題を特定するために、以下を実行してください：

```sql
-- 1. テーブルの存在と構造を確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'line_link_sessions'
ORDER BY 
    ordinal_position;

-- 2. RLSポリシーを確認
SELECT
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'line_link_sessions';

-- 3. 最新のセッションデータを確認
SELECT 
    token,
    user_id,
    expires_at,
    created_at,
    CASE 
        WHEN expires_at < now() THEN '期限切れ'
        ELSE '有効'
    END AS status
FROM 
    line_link_sessions
ORDER BY 
    created_at DESC
LIMIT 5;
```

## 解決手順のまとめ

1. **テーブルを作成**（まだの場合）:
   ```sql
   -- create_line_link_sessions_table.sql を実行
   ```

2. **RLSポリシーを修正**:
   ```sql
   -- fix_line_link_sessions_rls.sql を実行
   ```

3. **環境変数を確認**:
   - Vercel Dashboardで`SUPABASE_SERVICE_ROLE_KEY`が設定されているか確認

4. **再デプロイ**:
   - 環境変数を変更した場合は再デプロイが必要

5. **LINE連携を再度試行**:
   - ブラウザのコンソールとVercelのログでエラーを確認

## ログの確認方法

### ブラウザのコンソール（クライアント側）

1. 開発者ツール（F12）を開く
2. 「Console」タブを選択
3. LINE連携ボタンをクリック
4. 以下のログを確認：
   - `セッション作成を試行中...`
   - `セッション作成成功:` または `セッション作成失敗`

### Vercelのログ（サーバー側）

1. Vercel Dashboard → Deployments
2. 最新のデプロイメントを選択
3. 「Functions」タブを選択
4. `/api/line/callback` を選択
5. 以下のログを確認：
   - `セッション検索開始:`
   - `セッション検索結果:`
   - `デバッグ: テーブル内の最新セッション`

これらのログを確認することで、問題の原因を特定できます。


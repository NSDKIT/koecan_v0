-- LINE連携データとRLSポリシーの確認用SQL
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. RLSポリシーの確認（重要）
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
    AND tablename = 'user_line_links'
ORDER BY
    cmd;

-- 2. 全データの確認（サービスロールで実行するか、RLSポリシーを一時的に無効化して実行）
-- 注意: このクエリはRLSポリシーによって結果が制限される可能性があります
SELECT 
    user_id,
    line_user_id,
    created_at,
    CASE 
        WHEN line_user_id IS NULL OR line_user_id = '' THEN '未連携（line_user_idがNULL）'
        ELSE '連携済み'
    END AS status
FROM 
    user_line_links
ORDER BY 
    created_at DESC
LIMIT 10;

-- 3. 現在のユーザーIDで確認（認証済みユーザーとして実行）
-- このクエリは、現在ログインしているユーザーのLINE連携情報のみを返します
SELECT 
    user_id,
    line_user_id,
    created_at
FROM 
    user_line_links
WHERE 
    user_id = auth.uid();

-- 4. テーブル構造の確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'user_line_links'
ORDER BY 
    ordinal_position;


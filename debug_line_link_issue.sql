-- LINE連携問題のデバッグ用SQL
-- このSQLをSupabaseのSQL Editorで実行して、問題を特定してください

-- 1. テーブルの存在確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'user_line_links'
ORDER BY 
    ordinal_position;

-- 2. RLSポリシーの確認
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'user_line_links';

-- 3. 全データの確認（管理者権限が必要）
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
    created_at DESC;

-- 4. 特定のユーザーのLINE連携状態を確認（user_idを置き換えてください）
-- SELECT * FROM user_line_links WHERE user_id = 'your-user-id-here';

-- 5. RLSが有効かどうか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS有効"
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename = 'user_line_links';


-- line_link_sessionsテーブルの存在確認と構造確認
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. テーブルの存在確認
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name = 'line_link_sessions';

-- 2. テーブルの構造確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'line_link_sessions'
ORDER BY 
    ordinal_position;

-- 3. RLSポリシーの確認
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
    AND tablename = 'line_link_sessions';

-- 4. RLSが有効かどうか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS有効"
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename = 'line_link_sessions';

-- 5. 既存のセッションデータを確認（管理者権限が必要）
-- SELECT 
--     id,
--     token,
--     user_id,
--     expires_at,
--     created_at,
--     used_at
-- FROM 
--     line_link_sessions
-- ORDER BY 
--     created_at DESC
-- LIMIT 10;


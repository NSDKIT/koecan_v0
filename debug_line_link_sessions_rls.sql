-- line_link_sessionsテーブルのRLSポリシーデバッグ用SQL
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. 現在の認証ユーザーIDを確認（認証済みユーザーが実行する必要があります）
SELECT 
    auth.uid() AS current_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ 認証されていません'
        ELSE '✅ 認証されています'
    END AS auth_status;

-- 2. テーブルの存在確認
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_name = 'line_link_sessions';

-- 3. RLSが有効かどうか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS有効"
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename = 'line_link_sessions';

-- 4. 現在のRLSポリシーを確認
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

-- 5. INSERTポリシーのテスト（実際には実行しない、条件のみ確認）
-- 以下の条件が満たされているか確認：
-- - auth.uid()がNULLでない
-- - user_id = auth.uid()がtrueになる
SELECT 
    auth.uid() AS current_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ auth.uid()がNULLです。認証が必要です。'
        ELSE '✅ auth.uid()が取得できています: ' || auth.uid()::text
    END AS auth_check;

-- 6. テーブルの構造確認（user_idカラムの型を確認）
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
    AND column_name IN ('id', 'token', 'user_id', 'expires_at', 'created_at', 'used_at')
ORDER BY 
    ordinal_position;

-- 7. 既存のセッションデータを確認（管理者権限が必要な場合があります）
-- SELECT 
--     id,
--     token,
--     user_id,
--     expires_at,
--     created_at,
--     used_at,
--     CASE 
--         WHEN user_id = auth.uid() THEN '✅ 自分のセッション'
--         ELSE '❌ 他人のセッション'
--     END AS ownership_check
-- FROM 
--     line_link_sessions
-- ORDER BY 
--     created_at DESC
-- LIMIT 10;


-- user.idとuser_line_links.user_idの関係を確認するSQL
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. user_line_linksテーブルの構造を確認
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

-- 2. 現在ログインしているユーザーのIDを確認（認証済みユーザーのみ）
-- このクエリは認証済みユーザーが実行する必要があります
SELECT 
    auth.uid() AS current_user_id,
    '現在のユーザーID（auth.uid()）' AS description;

-- 3. 現在のユーザーのLINE連携情報を確認
SELECT 
    ull.user_id AS "user_line_links.user_id",
    auth.uid() AS "user.id (auth.uid())",
    CASE 
        WHEN ull.user_id = auth.uid() THEN '✅ 一致'
        ELSE '❌ 不一致'
    END AS "一致確認",
    ull.line_user_id AS "LINEユーザーID",
    ull.created_at AS "連携日時"
FROM 
    user_line_links ull
WHERE 
    ull.user_id = auth.uid();

-- 4. 全ユーザーのLINE連携情報を確認（管理者権限が必要）
-- SELECT 
--     u.id AS "users.id",
--     ull.user_id AS "user_line_links.user_id",
--     CASE 
--         WHEN u.id = ull.user_id THEN '✅ 一致'
--         ELSE '❌ 不一致'
--     END AS "一致確認",
--     ull.line_user_id AS "LINEユーザーID",
--     ull.created_at AS "連携日時"
-- FROM 
--     users u
--     LEFT JOIN user_line_links ull ON u.id = ull.user_id
-- ORDER BY 
--     ull.created_at DESC;


-- LINE連携状態を確認するSQL
-- このSQLをSupabaseのSQL Editorで実行して、既存のLINE連携データを確認してください

-- 1. user_line_linksテーブルの存在確認
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

-- 2. 既存のLINE連携データを確認
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

-- 3. 特定のユーザーのLINE連携状態を確認（user_idを置き換えてください）
-- SELECT * FROM user_line_links WHERE user_id = 'your-user-id-here';


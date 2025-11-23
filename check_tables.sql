-- ============================================
-- Supabase テーブル一覧とカラム情報を確認するSQL
-- ============================================

-- 1. すべてのテーブル一覧を取得（publicスキーマのみ）
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY 
    table_name;

-- 2. 各テーブルの詳細情報（カラム名、データ型、制約など）
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        ELSE ''
    END AS key_type,
    fk.foreign_table_name,
    fk.foreign_column_name
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    LEFT JOIN (
        SELECT 
            ku.table_name,
            ku.column_name
        FROM 
            information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku 
                ON tc.constraint_name = ku.constraint_name
        WHERE 
            tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    LEFT JOIN (
        SELECT
            ku.table_name,
            ku.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS ku
                ON tc.constraint_name = ku.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name,
    c.ordinal_position;

-- 3. テーブルごとのカラム数を集計
SELECT 
    table_name,
    COUNT(*) AS column_count
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
GROUP BY 
    table_name
ORDER BY 
    table_name;

-- 4. 外部キー制約の詳細
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY
    tc.table_name,
    kcu.column_name;

-- 5. インデックス一覧
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;

-- 6. チェック制約の詳細
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM
    information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
WHERE
    tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
ORDER BY
    tc.table_name,
    tc.constraint_name;

-- 7. RLS（Row Level Security）の有効/無効状態
SELECT
    schemaname,
    tablename,
    rowsecurity AS "RLS有効"
FROM
    pg_tables
WHERE
    schemaname = 'public'
ORDER BY
    tablename;

-- 8. RLSポリシーの詳細
SELECT
    schemaname AS "スキーマ名",
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    permissive AS "許可タイプ",
    roles AS "適用ロール",
    cmd AS "操作種別",
    qual AS "USING句（SELECT/UPDATE/DELETE用）",
    with_check AS "WITH CHECK句（INSERT/UPDATE用）"
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    policyname;

-- 9. テーブルごとのRLSポリシー数
SELECT
    tablename AS "テーブル名",
    COUNT(*) AS "ポリシー数",
    STRING_AGG(cmd, ', ' ORDER BY cmd) AS "操作種別"
FROM
    pg_policies
WHERE
    schemaname = 'public'
GROUP BY
    tablename
ORDER BY
    tablename;

-- 10. RLSが有効だがポリシーがないテーブル（潜在的な問題）
SELECT
    t.tablename AS "テーブル名",
    t.rowsecurity AS "RLS有効",
    COUNT(p.policyname) AS "ポリシー数"
FROM
    pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE
    t.schemaname = 'public'
    AND t.rowsecurity = true
GROUP BY
    t.tablename,
    t.rowsecurity
HAVING
    COUNT(p.policyname) = 0
ORDER BY
    t.tablename;


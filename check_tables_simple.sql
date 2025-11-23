-- ============================================
-- 簡易版: テーブル一覧とカラム情報
-- ============================================

-- 【推奨】テーブル一覧とカラム情報を一度に表示
SELECT 
    t.table_name AS "テーブル名",
    c.column_name AS "カラム名",
    c.data_type AS "データ型",
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')'
        ELSE c.data_type
    END AS "型詳細",
    c.is_nullable AS "NULL許可",
    c.column_default AS "デフォルト値",
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PK'
        WHEN fk.column_name IS NOT NULL THEN 'FK → ' || fk.foreign_table_name || '.' || fk.foreign_column_name
        ELSE ''
    END AS "キー情報"
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    LEFT JOIN (
        SELECT
            ku.table_name,
            ku.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS ku ON tc.constraint_name = ku.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name,
    c.ordinal_position;

-- ============================================
-- RLS（Row Level Security）ポリシー情報
-- ============================================

-- RLSの有効/無効状態
SELECT
    tablename AS "テーブル名",
    rowsecurity AS "RLS有効"
FROM
    pg_tables
WHERE
    schemaname = 'public'
ORDER BY
    tablename;

-- RLSポリシーの詳細
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    cmd AS "操作",
    roles AS "ロール",
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    policyname;


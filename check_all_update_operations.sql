-- ============================================
-- UPDATE操作が行われている可能性があるテーブルの確認
-- ============================================
-- コードベースでUPDATE操作が行われているテーブルと
-- 実際にUPDATEポリシーが設定されているテーブルを比較します
-- ============================================

-- 1. UPDATEポリシーがあるすべてのテーブル
SELECT DISTINCT
    tablename AS "UPDATEポリシーがあるテーブル",
    COUNT(*) OVER (PARTITION BY tablename) AS "ポリシー数"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
ORDER BY
    tablename;

-- 2. すべてのテーブル一覧（UPDATEポリシーの有無を確認）
SELECT
    t.table_name AS "テーブル名",
    CASE 
        WHEN p.tablename IS NOT NULL THEN '✅ UPDATEポリシーあり'
        ELSE '❌ UPDATEポリシーなし'
    END AS "UPDATEポリシー状態",
    COALESCE(p.policy_count, 0) AS "UPDATEポリシー数"
FROM
    information_schema.tables t
    LEFT JOIN (
        SELECT
            tablename,
            COUNT(*) AS policy_count
        FROM
            pg_policies
        WHERE
            schemaname = 'public'
            AND cmd = 'UPDATE'
        GROUP BY
            tablename
    ) p ON t.table_name = p.tablename
WHERE
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY
    CASE 
        WHEN p.tablename IS NOT NULL THEN 1
        ELSE 2
    END,
    t.table_name;

-- 3. UPDATEポリシーがないテーブル一覧
SELECT
    t.table_name AS "テーブル名"
FROM
    information_schema.tables t
    LEFT JOIN (
        SELECT DISTINCT tablename
        FROM pg_policies
        WHERE schemaname = 'public' AND cmd = 'UPDATE'
    ) p ON t.table_name = p.tablename
WHERE
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND p.tablename IS NULL
ORDER BY
    t.table_name;


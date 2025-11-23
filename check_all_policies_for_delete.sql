-- ============================================
-- ALLポリシーとDELETE操作の関係を確認
-- ============================================
-- ALLポリシーがDELETE操作をカバーしているか確認します
-- ============================================

-- 1. DELETE操作が行われるテーブルのALLポリシー詳細
SELECT
    p.tablename AS "テーブル名",
    p.policyname AS "ポリシー名",
    p.cmd AS "操作",
    p.qual AS "USING句",
    p.with_check AS "WITH CHECK句",
    CASE 
        WHEN p.cmd = 'ALL' AND (p.qual IS NULL OR p.qual = '') THEN '⚠️ USING句なし（DELETE操作が無制限の可能性）'
        WHEN p.cmd = 'ALL' THEN '✅ USING句あり（DELETE操作が制限されている）'
        ELSE '-'
    END AS "DELETE操作の状態"
FROM
    pg_policies p
WHERE
    p.schemaname = 'public'
    AND p.tablename IN ('advertisements', 'surveys')
    AND p.cmd = 'ALL'
ORDER BY
    p.tablename,
    p.policyname;

-- 2. DELETE操作が必要なテーブルとポリシーの状況
SELECT
    t.table_name AS "テーブル名",
    CASE WHEN c.relrowsecurity THEN '有効' ELSE '無効' END AS "RLS有効",
    COUNT(DISTINCT CASE WHEN p.cmd = 'DELETE' THEN 1 END) AS "DELETEポリシー数",
    COUNT(DISTINCT CASE WHEN p.cmd = 'ALL' THEN 1 END) AS "ALLポリシー数",
    STRING_AGG(DISTINCT p.policyname, ', ') FILTER (WHERE p.cmd = 'ALL') AS "ALLポリシー名",
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN p.cmd = 'DELETE' THEN 1 END) > 0 THEN '✅ DELETEポリシーあり'
        WHEN COUNT(DISTINCT CASE WHEN p.cmd = 'ALL' THEN 1 END) > 0 THEN '⚠️ ALLポリシーに依存（詳細確認が必要）'
        ELSE '🚨 DELETEポリシーなし'
    END AS "状態"
FROM
    information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
    LEFT JOIN pg_policies p ON t.table_name = p.tablename AND p.schemaname = 'public'
WHERE
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.relkind = 'r'
    AND t.table_name IN ('advertisements', 'surveys')
GROUP BY
    t.table_name,
    c.relrowsecurity
ORDER BY
    t.table_name;

-- 3. ALLポリシーのUSING句の詳細（DELETE操作への影響を確認）
SELECT
    p.tablename AS "テーブル名",
    p.policyname AS "ポリシー名",
    p.qual AS "USING句",
    CASE 
        WHEN p.qual IS NULL OR p.qual = '' THEN '🚨 重大: USING句なし - DELETE操作が無制限'
        ELSE '✅ USING句あり - DELETE操作が制限されている'
    END AS "セキュリティ状態",
    'ALLポリシーはSELECT、INSERT、UPDATE、DELETEのすべての操作に適用されます。' ||
    CASE 
        WHEN p.qual IS NULL OR p.qual = '' THEN ' USING句がないため、すべてのユーザーが削除可能です。'
        ELSE ' USING句により、削除操作が適切に制限されています。'
    END AS "説明"
FROM
    pg_policies p
WHERE
    p.schemaname = 'public'
    AND p.tablename IN ('advertisements', 'surveys')
    AND p.cmd = 'ALL'
ORDER BY
    p.tablename,
    p.policyname;


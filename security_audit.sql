-- ============================================
-- 包括的なセキュリティ監査SQL
-- ============================================
-- データベースのセキュリティ状態を包括的に確認します
-- ============================================

-- 1. RLSが有効だがポリシーがないテーブル（重大な問題）
SELECT
    t.tablename AS "テーブル名",
    CASE WHEN c.relrowsecurity THEN '有効' ELSE '無効' END AS "RLS有効",
    COUNT(p.policyname) AS "ポリシー数",
    CASE 
        WHEN COUNT(p.policyname) = 0 AND c.relrowsecurity THEN '🚨 重大: ポリシーなし'
        ELSE '✅ OK'
    END AS "状態"
FROM
    pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE
    t.schemaname = 'public'
    AND c.relkind = 'r'  -- 通常のテーブルのみ
GROUP BY
    t.tablename,
    c.relrowsecurity
HAVING
    COUNT(p.policyname) = 0 AND c.relrowsecurity = true
ORDER BY
    t.tablename;

-- 2. INSERTポリシーのWITH CHECK句チェック
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    CASE 
        WHEN with_check IS NOT NULL AND with_check != '' THEN '✅ OK'
        ELSE '⚠️ WITH CHECK句なし'
    END AS "WITH CHECK句状態",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'INSERT'
ORDER BY
    CASE 
        WHEN with_check IS NOT NULL AND with_check != '' THEN 2
        ELSE 1
    END,
    tablename,
    policyname;

-- 3. UPDATEポリシーのWITH CHECK句チェック（再確認）
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    CASE 
        WHEN with_check IS NOT NULL AND with_check != '' THEN '✅ OK'
        ELSE '⚠️ WITH CHECK句なし'
    END AS "WITH CHECK句状態",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
ORDER BY
    CASE 
        WHEN with_check IS NOT NULL AND with_check != '' THEN 2
        ELSE 1
    END,
    tablename,
    policyname;

-- 4. DELETEポリシーの存在確認
SELECT
    tablename AS "テーブル名",
    COUNT(*) AS "DELETEポリシー数",
    STRING_AGG(policyname, ', ' ORDER BY policyname) AS "ポリシー名一覧",
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ DELETEポリシーなし'
        ELSE '✅ OK'
    END AS "状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'DELETE'
GROUP BY
    tablename
ORDER BY
    CASE 
        WHEN COUNT(*) = 0 THEN 1
        ELSE 2
    END,
    tablename;

-- 5. テーブルごとの操作種別カバレッジ
SELECT
    t.table_name AS "テーブル名",
    CASE WHEN c.relrowsecurity THEN '有効' ELSE '無効' END AS "RLS有効",
    COUNT(DISTINCT CASE WHEN p.cmd = 'SELECT' THEN 1 END) AS "SELECTポリシー",
    COUNT(DISTINCT CASE WHEN p.cmd = 'INSERT' THEN 1 END) AS "INSERTポリシー",
    COUNT(DISTINCT CASE WHEN p.cmd = 'UPDATE' THEN 1 END) AS "UPDATEポリシー",
    COUNT(DISTINCT CASE WHEN p.cmd = 'DELETE' THEN 1 END) AS "DELETEポリシー",
    COUNT(DISTINCT CASE WHEN p.cmd = 'ALL' THEN 1 END) AS "ALLポリシー",
    COUNT(DISTINCT p.policyname) AS "総ポリシー数",
    CASE 
        WHEN c.relrowsecurity = true AND COUNT(DISTINCT p.policyname) = 0 THEN '🚨 重大: RLS有効だがポリシーなし'
        WHEN c.relrowsecurity = false THEN '⚠️ RLS無効'
        ELSE '✅ OK'
    END AS "状態"
FROM
    information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
    LEFT JOIN pg_policies p ON t.table_name = p.tablename AND p.schemaname = 'public'
WHERE
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.relkind = 'r'  -- 通常のテーブルのみ
GROUP BY
    t.table_name,
    c.relrowsecurity
ORDER BY
    CASE 
        WHEN c.relrowsecurity = true AND COUNT(DISTINCT p.policyname) = 0 THEN 1
        WHEN c.relrowsecurity = false THEN 2
        ELSE 3
    END,
    t.table_name;

-- 6. すべてのポリシーのWITH CHECK句とUSING句の状態
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    cmd AS "操作",
    CASE 
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') AND (qual IS NULL OR qual = '') THEN '⚠️ USING句なし'
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') THEN '✅ USING句あり'
        ELSE '-'
    END AS "USING句状態",
    CASE 
        WHEN cmd IN ('INSERT', 'UPDATE') AND (with_check IS NULL OR with_check = '') THEN '⚠️ WITH CHECK句なし'
        WHEN cmd IN ('INSERT', 'UPDATE') THEN '✅ WITH CHECK句あり'
        ELSE '-'
    END AS "WITH CHECK句状態",
    CASE 
        WHEN (cmd IN ('SELECT', 'UPDATE', 'DELETE') AND (qual IS NULL OR qual = ''))
          OR (cmd IN ('INSERT', 'UPDATE') AND (with_check IS NULL OR with_check = '')) THEN '⚠️ 要確認'
        ELSE '✅ OK'
    END AS "総合状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
    CASE 
        WHEN (cmd IN ('SELECT', 'UPDATE', 'DELETE') AND (qual IS NULL OR qual = ''))
          OR (cmd IN ('INSERT', 'UPDATE') AND (with_check IS NULL OR with_check = '')) THEN 1
        ELSE 2
    END,
    tablename,
    CASE cmd
        WHEN 'ALL' THEN 1
        WHEN 'SELECT' THEN 2
        WHEN 'INSERT' THEN 3
        WHEN 'UPDATE' THEN 4
        WHEN 'DELETE' THEN 5
        ELSE 6
    END,
    policyname;

-- 7. セキュリティサマリー
SELECT
    'RLS有効テーブル数' AS "項目",
    COUNT(*)::text AS "値"
FROM
    pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true

UNION ALL

SELECT
    '総ポリシー数',
    COUNT(*)::text
FROM
    pg_policies
WHERE
    schemaname = 'public'

UNION ALL

SELECT
    'UPDATEポリシー数（WITH CHECK句あり）',
    COUNT(*)::text
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
    AND with_check IS NOT NULL
    AND with_check != ''

UNION ALL

SELECT
    'UPDATEポリシー数（WITH CHECK句なし）',
    COUNT(*)::text
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
    AND (with_check IS NULL OR with_check = '')

UNION ALL

SELECT
    'INSERTポリシー数（WITH CHECK句あり）',
    COUNT(*)::text
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'INSERT'
    AND with_check IS NOT NULL
    AND with_check != ''

UNION ALL

SELECT
    'INSERTポリシー数（WITH CHECK句なし）',
    COUNT(*)::text
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'INSERT'
    AND (with_check IS NULL OR with_check = '')

UNION ALL

SELECT
    'RLS有効だがポリシーなしのテーブル数',
    COUNT(*)::text
FROM
    (
        SELECT t.tablename
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
        LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
        WHERE t.schemaname = 'public' 
          AND c.relkind = 'r'
          AND c.relrowsecurity = true
        GROUP BY t.tablename
        HAVING COUNT(p.policyname) = 0
    ) sub;


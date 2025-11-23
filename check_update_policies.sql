-- ============================================
-- UPDATEポリシーのWITH CHECK句チェック
-- ============================================
-- すべてのUPDATEポリシーを確認し、WITH CHECK句がないものを検出します
-- ============================================

-- 0. UPDATEポリシーがあるすべてのテーブル一覧
SELECT DISTINCT
    tablename AS "テーブル名",
    COUNT(*) OVER (PARTITION BY tablename) AS "UPDATEポリシー数"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
ORDER BY
    tablename;

-- 1. すべてのUPDATEポリシーの詳細
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    permissive AS "許可タイプ",
    roles AS "ロール",
    CASE 
        WHEN qual IS NOT NULL AND qual != '' THEN qual
        ELSE '(USING句なし)'
    END AS "USING句",
    CASE 
        WHEN with_check IS NOT NULL AND with_check != '' THEN with_check
        ELSE '(WITH CHECK句なし) ⚠️'
    END AS "WITH CHECK句",
    CASE 
        WHEN with_check IS NULL OR with_check = '' THEN '⚠️ 要修正'
        ELSE '✅ OK'
    END AS "状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
ORDER BY
    CASE 
        WHEN with_check IS NULL OR with_check = '' THEN 1
        ELSE 2
    END,
    tablename,
    policyname;

-- 2. WITH CHECK句がないUPDATEポリシー（要修正）
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    qual AS "USING句",
    'WITH CHECK句なし' AS "問題"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
    AND (with_check IS NULL OR with_check = '')
ORDER BY
    tablename,
    policyname;

-- 3. すべてのUPDATEポリシーのサマリー
SELECT
    COUNT(*) AS "総UPDATEポリシー数",
    COUNT(CASE WHEN with_check IS NOT NULL AND with_check != '' THEN 1 END) AS "WITH CHECK句あり",
    COUNT(CASE WHEN with_check IS NULL OR with_check = '' THEN 1 END) AS "WITH CHECK句なし（要修正）"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE';

-- 4. テーブルごとのUPDATEポリシー状態
SELECT
    tablename AS "テーブル名",
    COUNT(*) AS "UPDATEポリシー数",
    COUNT(CASE WHEN with_check IS NOT NULL AND with_check != '' THEN 1 END) AS "WITH CHECK句あり",
    COUNT(CASE WHEN with_check IS NULL OR with_check = '' THEN 1 END) AS "WITH CHECK句なし",
    CASE 
        WHEN COUNT(CASE WHEN with_check IS NULL OR with_check = '' THEN 1 END) > 0 THEN '⚠️ 要修正'
        ELSE '✅ OK'
    END AS "状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
GROUP BY
    tablename
ORDER BY
    CASE 
        WHEN COUNT(CASE WHEN with_check IS NULL OR with_check = '' THEN 1 END) > 0 THEN 1
        ELSE 2
    END,
    tablename;


-- ============================================
-- RLSポリシーの詳細情報を確認するSQL
-- ============================================

-- テーブルごとのRLSポリシー詳細（読みやすい形式）
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    CASE cmd
        WHEN 'SELECT' THEN 'SELECT（読み取り）'
        WHEN 'INSERT' THEN 'INSERT（挿入）'
        WHEN 'UPDATE' THEN 'UPDATE（更新）'
        WHEN 'DELETE' THEN 'DELETE（削除）'
        WHEN 'ALL' THEN 'ALL（全操作）'
        ELSE cmd
    END AS "操作種別",
    CASE permissive
        WHEN 'PERMISSIVE' THEN '許可'
        WHEN 'RESTRICTIVE' THEN '制限'
        ELSE permissive
    END AS "許可タイプ",
    roles AS "適用ロール",
    CASE 
        WHEN qual IS NOT NULL THEN qual
        ELSE '(なし)'
    END AS "USING句（条件）",
    CASE 
        WHEN with_check IS NOT NULL THEN with_check
        ELSE '(なし)'
    END AS "WITH CHECK句（検証）"
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
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

-- テーブルごとのポリシー概要（サマリー）
SELECT
    tablename AS "テーブル名",
    COUNT(*) AS "総ポリシー数",
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) AS "SELECT数",
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) AS "INSERT数",
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) AS "UPDATE数",
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) AS "DELETE数",
    COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) AS "ALL数",
    STRING_AGG(DISTINCT roles::text, ', ' ORDER BY roles::text) AS "適用ロール一覧"
FROM
    pg_policies
WHERE
    schemaname = 'public'
GROUP BY
    tablename
ORDER BY
    tablename;

-- 特定のテーブルのポリシーを詳細に確認（例: usersテーブル）
-- テーブル名を変更して使用してください
SELECT
    policyname AS "ポリシー名",
    cmd AS "操作",
    permissive AS "許可タイプ",
    roles AS "ロール",
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'users'  -- ここを変更して他のテーブルを確認可能
ORDER BY
    CASE cmd
        WHEN 'ALL' THEN 1
        WHEN 'SELECT' THEN 2
        WHEN 'INSERT' THEN 3
        WHEN 'UPDATE' THEN 4
        WHEN 'DELETE' THEN 5
        ELSE 6
    END,
    policyname;


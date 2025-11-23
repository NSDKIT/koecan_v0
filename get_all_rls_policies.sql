-- ============================================
-- 全テーブルのRLSポリシー詳細を取得するSQL
-- ============================================

-- 【推奨】全テーブルのRLSポリシー詳細（読みやすい形式）
-- このクエリを実行すると、すべてのテーブルのポリシーが一覧表示されます
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
    CASE 
        WHEN roles = '{authenticated}' THEN '認証済みユーザー'
        WHEN roles = '{anon}' THEN '匿名ユーザー'
        WHEN roles = '{service_role}' THEN 'サービスロール'
        ELSE roles::text
    END AS "適用ロール",
    CASE 
        WHEN qual IS NOT NULL AND qual != '' THEN qual
        ELSE '(条件なし)'
    END AS "USING句（条件）",
    CASE 
        WHEN with_check IS NOT NULL AND with_check != '' THEN with_check
        ELSE '(検証なし)'
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

-- ============================================
-- テーブルごとのポリシー概要（サマリー）
-- ============================================
SELECT
    tablename AS "テーブル名",
    COUNT(*) AS "総ポリシー数",
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) AS "SELECT数",
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) AS "INSERT数",
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) AS "UPDATE数",
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) AS "DELETE数",
    COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) AS "ALL数",
    STRING_AGG(DISTINCT 
        CASE 
            WHEN roles = '{authenticated}' THEN '認証済み'
            WHEN roles = '{anon}' THEN '匿名'
            WHEN roles = '{service_role}' THEN 'サービス'
            ELSE roles::text
        END, 
        ', ' 
        ORDER BY 
            CASE 
                WHEN roles = '{authenticated}' THEN '認証済み'
                WHEN roles = '{anon}' THEN '匿名'
                WHEN roles = '{service_role}' THEN 'サービス'
                ELSE roles::text
            END
    ) AS "適用ロール一覧"
FROM
    pg_policies
WHERE
    schemaname = 'public'
GROUP BY
    tablename
ORDER BY
    tablename;

-- ============================================
-- JSON形式で出力（プログラムで処理しやすい形式）
-- ============================================
SELECT
    json_agg(
        json_build_object(
            'テーブル名', tablename,
            'ポリシー名', policyname,
            '操作', cmd,
            '許可タイプ', permissive,
            'ロール', roles,
            'USING句', COALESCE(qual, ''),
            'WITH CHECK句', COALESCE(with_check, '')
        )
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
            policyname
    ) AS "全ポリシーJSON"
FROM
    pg_policies
WHERE
    schemaname = 'public';

-- ============================================
-- テーブルごとにグループ化したJSON形式
-- ============================================
SELECT
    tablename AS "テーブル名",
    json_agg(
        json_build_object(
            'ポリシー名', policyname,
            '操作', cmd,
            '許可タイプ', permissive,
            'ロール', roles,
            'USING句', COALESCE(qual, ''),
            'WITH CHECK句', COALESCE(with_check, '')
        )
        ORDER BY 
            CASE cmd
                WHEN 'ALL' THEN 1
                WHEN 'SELECT' THEN 2
                WHEN 'INSERT' THEN 3
                WHEN 'UPDATE' THEN 4
                WHEN 'DELETE' THEN 5
                ELSE 6
            END,
            policyname
    ) AS "ポリシー詳細"
FROM
    pg_policies
WHERE
    schemaname = 'public'
GROUP BY
    tablename
ORDER BY
    tablename;

-- ============================================
-- 特定のテーブルのポリシーを詳細に確認
-- テーブル名を変更して使用してください
-- ============================================
-- 例: usersテーブルのポリシーを確認
/*
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
*/

-- ============================================
-- ポリシーに問題がないかチェック
-- ============================================

-- 1. RLSが有効だがポリシーがないテーブル（潜在的な問題）
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

-- 2. 同じ操作に対して複数のポリシーがあるテーブル（確認推奨）
SELECT
    tablename AS "テーブル名",
    cmd AS "操作",
    COUNT(*) AS "ポリシー数",
    STRING_AGG(policyname, ', ' ORDER BY policyname) AS "ポリシー名一覧"
FROM
    pg_policies
WHERE
    schemaname = 'public'
GROUP BY
    tablename,
    cmd
HAVING
    COUNT(*) > 1
ORDER BY
    tablename,
    CASE cmd
        WHEN 'ALL' THEN 1
        WHEN 'SELECT' THEN 2
        WHEN 'INSERT' THEN 3
        WHEN 'UPDATE' THEN 4
        WHEN 'DELETE' THEN 5
        ELSE 6
    END;

-- 3. USING句とWITH CHECK句がないポリシー（潜在的な問題）
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    cmd AS "操作",
    CASE 
        WHEN qual IS NULL OR qual = '' THEN 'USING句なし'
        ELSE 'OK'
    END AS "USING句状態",
    CASE 
        WHEN with_check IS NULL OR with_check = '' THEN 'WITH CHECK句なし'
        ELSE 'OK'
    END AS "WITH CHECK句状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND (
        (cmd IN ('SELECT', 'UPDATE', 'DELETE') AND (qual IS NULL OR qual = ''))
        OR
        (cmd IN ('INSERT', 'UPDATE') AND (with_check IS NULL OR with_check = ''))
    )
ORDER BY
    tablename,
    policyname;


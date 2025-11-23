-- ============================================
-- advertisementsテーブルのDELETEポリシー修正
-- ============================================
-- 現在のALLポリシー（認証済みユーザー全員）を削除し、
-- 管理者のみが操作できるように修正します
-- ============================================

-- 1. 現在のポリシーを確認
SELECT
    policyname AS "現在のポリシー名",
    cmd AS "操作",
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'advertisements'
ORDER BY
    cmd,
    policyname;

-- 2. 問題のあるALLポリシーを削除
-- 「Authenticated users full access on advertisements」を削除
DROP POLICY IF EXISTS "Authenticated users full access on advertisements" ON advertisements;

-- 3. 管理者のみが操作できるALLポリシーを作成
-- これにより、SELECT、INSERT、UPDATE、DELETEすべてが管理者のみに制限されます
CREATE POLICY "Admins can manage all advertisements" 
ON advertisements 
FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

-- 4. 修正後のポリシーを確認
SELECT
    policyname AS "修正後のポリシー名",
    cmd AS "操作",
    qual AS "USING句",
    with_check AS "WITH CHECK句",
    CASE 
        WHEN cmd = 'ALL' AND qual = 'is_admin()' THEN '✅ 管理者のみ操作可能'
        WHEN cmd = 'SELECT' THEN '✅ SELECTポリシー（既存）'
        WHEN cmd = 'UPDATE' THEN '✅ UPDATEポリシー（既存）'
        ELSE 'その他'
    END AS "状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'advertisements'
ORDER BY
    CASE cmd
        WHEN 'ALL' THEN 1
        WHEN 'SELECT' THEN 2
        WHEN 'UPDATE' THEN 3
        ELSE 4
    END,
    policyname;

-- 5. セキュリティ確認サマリー
SELECT
    'advertisementsテーブルのセキュリティ状態' AS "項目",
    CASE 
        WHEN COUNT(*) FILTER (WHERE cmd = 'ALL' AND qual = 'is_admin()') > 0 
        THEN '✅ 管理者のみが全操作可能'
        ELSE '⚠️ 要確認'
    END AS "状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'advertisements'
    AND cmd = 'ALL';


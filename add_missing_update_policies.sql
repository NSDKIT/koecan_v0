-- ============================================
-- 不足しているUPDATEポリシーの追加
-- ============================================
-- コードベースでUPDATE操作が行われているが、
-- UPDATEポリシーがないテーブルにポリシーを追加します
-- ============================================

-- 【重要】実行前に確認
-- 以下のクエリで、既存のポリシーを確認してください：
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('monitor_profiles', 'advertisements');

-- ============================================
-- 1. monitor_profilesテーブルのUPDATEポリシーを追加
-- ============================================
-- ユーザーが自分のプロファイルを更新できるようにする
-- 既存のALLポリシーがある場合は、それを使用するか、UPDATE専用ポリシーを追加

-- 既存のALLポリシーを確認（存在する場合は削除してUPDATE専用に変更）
DROP POLICY IF EXISTS "Monitor profiles are editable by owner" ON monitor_profiles;

-- UPDATE専用ポリシーを追加（WITH CHECK句付き）
CREATE POLICY "Monitors can update own profile" ON monitor_profiles
  FOR UPDATE TO authenticated
  USING (user_id = uid())  -- 更新前: 自分のプロファイルであることを確認
  WITH CHECK (user_id = uid());  -- 更新後: 自分のプロファイルであることを確認

-- ============================================
-- 2. advertisementsテーブルのUPDATEポリシーを確認・追加
-- ============================================
-- "Admins can manage all advertisements"というALLポリシーが存在するが、
-- ALLポリシーにはWITH CHECK句がない可能性があるため、
-- UPDATE専用ポリシーを追加してWITH CHECK句を確実にする

-- 既存のALLポリシーは残しつつ、UPDATE専用ポリシーを追加
-- （PostgreSQLでは、複数のポリシーが存在する場合、いずれかが許可すればOK）
CREATE POLICY "Admins can update advertisements" ON advertisements
  FOR UPDATE TO authenticated
  USING (is_admin())  -- 更新前: 管理者であることを確認
  WITH CHECK (is_admin());  -- 更新後: 管理者であることを確認

-- ============================================
-- 修正後の確認
-- ============================================
-- 以下のクエリで、UPDATEポリシーが正しく追加されたか確認してください：

-- 1. monitor_profilesとadvertisementsのUPDATE/ALLポリシーを確認
SELECT
    tablename AS "テーブル名",
    policyname AS "ポリシー名",
    cmd AS "操作",
    qual AS "USING句",
    with_check AS "WITH CHECK句",
    CASE 
        WHEN cmd = 'UPDATE' AND (with_check IS NULL OR with_check = '') THEN '⚠️ WITH CHECK句なし'
        WHEN cmd = 'ALL' AND (with_check IS NULL OR with_check = '') THEN '⚠️ ALLポリシー（WITH CHECK句なし）'
        ELSE '✅ OK'
    END AS "状態"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename IN ('monitor_profiles', 'advertisements')
    AND cmd IN ('UPDATE', 'ALL')
ORDER BY
    tablename,
    CASE cmd
        WHEN 'ALL' THEN 1
        WHEN 'UPDATE' THEN 2
        ELSE 3
    END,
    policyname;

-- 2. すべてのUPDATEポリシーの状態を確認
SELECT
    tablename AS "テーブル名",
    COUNT(*) AS "UPDATEポリシー数",
    COUNT(CASE WHEN with_check IS NOT NULL AND with_check != '' THEN 1 END) AS "WITH CHECK句あり",
    COUNT(CASE WHEN with_check IS NULL OR with_check = '' THEN 1 END) AS "WITH CHECK句なし"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND cmd = 'UPDATE'
    AND tablename IN ('monitor_profiles', 'advertisements')
GROUP BY
    tablename
ORDER BY
    tablename;


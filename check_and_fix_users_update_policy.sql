-- ============================================
-- usersテーブルのUPDATEポリシーを確認・修正
-- ============================================
-- 名前更新ができない問題を解決するため、
-- usersテーブルのUPDATEポリシーを確認し、必要に応じて修正します
-- ============================================

-- 1. 現在のポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
  AND cmd = 'UPDATE';

-- 2. 現在のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- 3. WITH CHECK句を含む新しいUPDATEポリシーを作成
-- これにより、更新後のデータも自分のものであることを確認できます
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (uid() = id)  -- 更新前: 自分のデータであることを確認
  WITH CHECK (uid() = id);  -- 更新後: 自分のデータであることを確認

-- 4. 修正後のポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
  AND cmd = 'UPDATE';

-- ============================================
-- 補足: uid()関数が正しく動作しているか確認
-- ============================================
-- 以下のクエリで、現在のユーザーIDを確認できます（認証が必要）
-- SELECT uid() AS current_user_id;

-- ============================================
-- 補足: usersテーブルの構造を確認
-- ============================================
-- 以下のクエリで、usersテーブルのカラムと制約を確認できます
-- SELECT 
--     column_name,
--     data_type,
--     is_nullable,
--     column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'users'
-- ORDER BY ordinal_position;


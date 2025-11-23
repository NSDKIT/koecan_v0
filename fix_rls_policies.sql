-- ============================================
-- RLSポリシーの修正: WITH CHECK句の追加
-- ============================================
-- 
-- 問題: UPDATE操作のポリシーでWITH CHECK句がない場合、
-- 更新後のデータがポリシーに適合するかどうかを検証できません。
-- これは潜在的なセキュリティリスクです。
--
-- このSQLを実行する前に、現在のポリシーを確認してください：
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'テーブル名';
-- ============================================

-- 1. usersテーブルのUPDATEポリシーを修正
-- 現在のポリシーを削除
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- WITH CHECK句を追加した新しいポリシーを作成
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (uid() = id)  -- 更新前のデータが自分のものであることを確認
  WITH CHECK (uid() = id);  -- 更新後のデータも自分のものであることを確認

-- 2. point_exchange_requestsテーブルのUPDATEポリシーを修正
-- 現在のポリシーを削除
DROP POLICY IF EXISTS "Admins can update exchange requests" ON public.point_exchange_requests;

-- WITH CHECK句を追加した新しいポリシーを作成
-- 管理者は全リクエストを更新可能だが、更新後も適切な状態であることを確認
CREATE POLICY "Admins can update exchange requests" ON public.point_exchange_requests
  FOR UPDATE TO authenticated
  USING (is_admin())  -- 更新前: 管理者であることを確認
  WITH CHECK (is_admin());  -- 更新後: 管理者であることを確認（念のため）

-- ============================================
-- 修正後の確認
-- ============================================
-- 以下のクエリで、WITH CHECK句が正しく設定されているか確認してください：
SELECT
    tablename,
    policyname,
    cmd,
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename IN ('users', 'point_exchange_requests')
    AND cmd = 'UPDATE'
ORDER BY
    tablename,
    policyname;


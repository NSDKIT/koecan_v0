-- 現在のユーザーが管理者かどうかを確認
SELECT 
  auth.uid() AS current_user_id,
  auth.jwt() -> 'user_metadata' ->> 'role' AS user_role,
  is_admin() AS is_admin_result;

-- 現在のユーザーのusersテーブルの情報を確認
SELECT 
  id,
  email,
  role,
  name
FROM users
WHERE id = auth.uid();


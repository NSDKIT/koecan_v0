-- ============================================
-- is_admin()関数の修正
-- ============================================
-- JWTのuser_metadataではなく、usersテーブルを直接参照するように修正
-- これにより、RLSポリシーが正しく動作します
-- ============================================

-- 既存のis_admin()関数を削除
DROP FUNCTION IF EXISTS is_admin();

-- usersテーブルを参照するis_admin()関数を作成
-- SECURITY DEFINERを使用して、RLSをバイパスしてusersテーブルにアクセス
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の確認
SELECT 
  proname AS "関数名",
  prosrc AS "関数定義"
FROM pg_proc
WHERE proname = 'is_admin';


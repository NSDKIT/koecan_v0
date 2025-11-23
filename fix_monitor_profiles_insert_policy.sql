-- ============================================
-- monitor_profilesテーブルのINSERTポリシー修正
-- ============================================
-- 新規登録時にmonitor_profilesテーブルへのINSERTが
-- RLSポリシーによって拒否される問題を修正します
-- ============================================

-- 【重要】実行前に確認
-- 以下のクエリで、既存のポリシーを確認してください：
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monitor_profiles';

-- ============================================
-- 1. 既存のALLポリシーを確認・修正
-- ============================================
-- ALLポリシーが存在する場合、WITH CHECK句がないとINSERTが失敗します
-- 既存のALLポリシーにWITH CHECK句を追加するか、
-- INSERT専用ポリシーを追加します

-- 既存のALLポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Monitor profiles are editable by owner" ON monitor_profiles;

-- INSERT専用ポリシーを追加（WITH CHECK句付き）
CREATE POLICY "Monitors can create own profile" ON monitor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = uid());  -- 自分のuser_idでプロファイルを作成可能

-- SELECT専用ポリシー（既存のものがある場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'monitor_profiles' 
    AND policyname = 'Monitor profiles are viewable by owner'
  ) THEN
    CREATE POLICY "Monitor profiles are viewable by owner" ON monitor_profiles
      FOR SELECT TO authenticated
      USING (user_id = uid());
  END IF;
END $$;

-- UPDATE専用ポリシー（既存のものがある場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'monitor_profiles' 
    AND policyname = 'Monitors can update own profile'
  ) THEN
    CREATE POLICY "Monitors can update own profile" ON monitor_profiles
      FOR UPDATE TO authenticated
      USING (user_id = uid())  -- 更新前: 自分のプロファイルであることを確認
      WITH CHECK (user_id = uid());  -- 更新後: 自分のプロファイルであることを確認
  END IF;
END $$;

-- ============================================
-- 確認クエリ
-- ============================================
-- 以下のクエリで、ポリシーが正しく作成されたか確認してください：
-- SELECT 
--   policyname,
--   cmd,
--   qual AS "USING句",
--   with_check AS "WITH CHECK句"
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename = 'monitor_profiles'
-- ORDER BY cmd, policyname;


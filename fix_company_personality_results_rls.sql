-- ============================================
-- company_personality_resultsテーブルのRLSポリシー修正
-- ============================================
-- FOR ALLポリシーではINSERT時にWITH CHECKが適用されない場合があるため、
-- INSERT用のポリシーを明示的に追加します
-- ============================================

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Admins can manage company personality results" ON company_personality_results;
DROP POLICY IF EXISTS "Anyone can view company personality results" ON company_personality_results;
DROP POLICY IF EXISTS "Admins can insert company personality results" ON company_personality_results;
DROP POLICY IF EXISTS "Admins can update company personality results" ON company_personality_results;
DROP POLICY IF EXISTS "Admins can delete company personality results" ON company_personality_results;

-- SELECTポリシー（全員が閲覧可能）
CREATE POLICY "Anyone can view company personality results"
  ON company_personality_results
  FOR SELECT
  USING (true);

-- INSERTポリシー（管理者のみ）
CREATE POLICY "Admins can insert company personality results"
  ON company_personality_results
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATEポリシー（管理者のみ）
CREATE POLICY "Admins can update company personality results"
  ON company_personality_results
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETEポリシー（管理者のみ）
CREATE POLICY "Admins can delete company personality results"
  ON company_personality_results
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ポリシーの確認
SELECT
    policyname AS "ポリシー名",
    cmd AS "操作",
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'company_personality_results'
ORDER BY
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
    END;


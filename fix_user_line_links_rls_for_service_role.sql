-- user_line_linksテーブルのRLSポリシー修正（service_role対応）
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can insert own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can update own line links" ON user_line_links;
DROP POLICY IF EXISTS "Service role can manage all line links" ON user_line_links;

-- 2. RLSが有効になっているか確認（有効化）
ALTER TABLE user_line_links ENABLE ROW LEVEL SECURITY;

-- 3. SELECTポリシー: ユーザーは自分のLINE連携情報を閲覧可能
CREATE POLICY "Users can view own line links"
  ON user_line_links
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. INSERTポリシー: ユーザーは自分のLINE連携情報を挿入可能
CREATE POLICY "Users can insert own line links"
  ON user_line_links
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. UPDATEポリシー: ユーザーは自分のLINE連携情報を更新可能
CREATE POLICY "Users can update own line links"
  ON user_line_links
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. サービスロールは全操作可能（APIルートから使用）
-- 重要: service_roleはRLSをバイパスするため、このポリシーは実際には不要ですが、
-- 明示的に設定することで、問題が発生した場合のデバッグが容易になります
CREATE POLICY "Service role can manage all line links"
  ON user_line_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. ポリシーの確認
SELECT
    policyname AS "ポリシー名",
    cmd AS "操作",
    roles AS "ロール",
    qual AS "USING句",
    with_check AS "WITH CHECK句"
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'user_line_links'
ORDER BY
    policyname;


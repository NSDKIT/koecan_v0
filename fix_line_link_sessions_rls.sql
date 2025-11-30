-- line_link_sessionsテーブルのRLSポリシー修正
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view own line link sessions" ON line_link_sessions;
DROP POLICY IF EXISTS "Users can insert own line link sessions" ON line_link_sessions;
DROP POLICY IF EXISTS "Users can update own line link sessions" ON line_link_sessions;
DROP POLICY IF EXISTS "Service role can manage all line link sessions" ON line_link_sessions;

-- 2. RLSが有効になっているか確認（有効化）
ALTER TABLE line_link_sessions ENABLE ROW LEVEL SECURITY;

-- 3. SELECTポリシー: ユーザーは自分のセッションを閲覧可能
CREATE POLICY "Users can view own line link sessions"
  ON line_link_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. INSERTポリシー: ユーザーは自分のセッションを挿入可能
-- WITH CHECK句で、挿入するレコードのuser_idが現在のユーザーIDと一致することを確認
CREATE POLICY "Users can insert own line link sessions"
  ON line_link_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. UPDATEポリシー: ユーザーは自分のセッションを更新可能
CREATE POLICY "Users can update own line link sessions"
  ON line_link_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. サービスロールは全操作可能（APIルートやGASから使用）
CREATE POLICY "Service role can manage all line link sessions"
  ON line_link_sessions
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
    AND tablename = 'line_link_sessions'
ORDER BY
    policyname;

-- 8. テスト用: 現在のユーザーIDを確認（認証済みユーザーが実行する必要があります）
-- SELECT auth.uid() AS current_user_id;


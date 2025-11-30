-- user_line_linksテーブルのRLSポリシーを作成
-- このSQLをSupabaseのSQL Editorで実行してください

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can insert own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can update own line links" ON user_line_links;

-- RLSを有効化
ALTER TABLE user_line_links ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー: ユーザーは自分のLINE連携情報を閲覧可能
CREATE POLICY "Users can view own line links"
  ON user_line_links
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERTポリシー: ユーザーは自分のLINE連携情報を挿入可能
CREATE POLICY "Users can insert own line links"
  ON user_line_links
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATEポリシー: ユーザーは自分のLINE連携情報を更新可能
CREATE POLICY "Users can update own line links"
  ON user_line_links
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


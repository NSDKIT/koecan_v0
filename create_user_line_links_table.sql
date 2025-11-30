-- user_line_linksテーブルの作成
-- このSQLをSupabaseのSQL Editorで実行してください

-- テーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS user_line_links (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  line_user_id text NOT NULL,
  access_token text, -- 必要に応じて保存（セキュリティに注意）
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(line_user_id) -- 1つのLINEアカウントは1つのユーザーにのみ紐づけられる
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_user_line_links_user_id ON user_line_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_line_links_line_user_id ON user_line_links(line_user_id);

-- RLSを有効化
ALTER TABLE user_line_links ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can insert own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can update own line links" ON user_line_links;
DROP POLICY IF EXISTS "Service role can manage all line links" ON user_line_links;

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

-- サービスロールは全操作可能（APIルートから使用）
CREATE POLICY "Service role can manage all line links"
  ON user_line_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- line_link_sessionsテーブルの作成
-- 一時トークンを使用してLINE連携セッションを管理するテーブル

-- テーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS line_link_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz, -- トークンが使用された時刻
  CONSTRAINT line_link_sessions_token_key UNIQUE (token)
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_line_link_sessions_token ON line_link_sessions(token);
CREATE INDEX IF NOT EXISTS idx_line_link_sessions_user_id ON line_link_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_line_link_sessions_expires_at ON line_link_sessions(expires_at);

-- 期限切れトークンを自動削除する関数（オプション）
CREATE OR REPLACE FUNCTION cleanup_expired_line_link_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM line_link_sessions
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- RLSを有効化
ALTER TABLE line_link_sessions ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view own line link sessions" ON line_link_sessions;
DROP POLICY IF EXISTS "Users can insert own line link sessions" ON line_link_sessions;
DROP POLICY IF EXISTS "Users can update own line link sessions" ON line_link_sessions;
DROP POLICY IF EXISTS "Service role can manage all line link sessions" ON line_link_sessions;

-- SELECTポリシー: ユーザーは自分のセッションを閲覧可能
CREATE POLICY "Users can view own line link sessions"
  ON line_link_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERTポリシー: ユーザーは自分のセッションを挿入可能
CREATE POLICY "Users can insert own line link sessions"
  ON line_link_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATEポリシー: ユーザーは自分のセッションを更新可能
CREATE POLICY "Users can update own line link sessions"
  ON line_link_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- サービスロールは全操作可能（APIルートやGASから使用）
CREATE POLICY "Service role can manage all line link sessions"
  ON line_link_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- コメント
COMMENT ON TABLE line_link_sessions IS 'LINE連携の一時セッショントークンを管理するテーブル';
COMMENT ON COLUMN line_link_sessions.token IS '一時トークン（UUID形式）';
COMMENT ON COLUMN line_link_sessions.user_id IS 'Supabase AuthのユーザーID';
COMMENT ON COLUMN line_link_sessions.expires_at IS 'トークンの有効期限';
COMMENT ON COLUMN line_link_sessions.used_at IS 'トークンが使用された時刻（使用後はNULLにしない）';


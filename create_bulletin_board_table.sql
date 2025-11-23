-- 掲示板の投稿を保存するテーブル
CREATE TABLE IF NOT EXISTS bulletin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false, -- ピン留め投稿
  display_order INTEGER NOT NULL DEFAULT 0, -- 表示順序（数値が小さいほど上に表示）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_display_order ON bulletin_posts(display_order DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_author_id ON bulletin_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_is_pinned ON bulletin_posts(is_pinned DESC);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_bulletin_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bulletin_posts_updated_at
  BEFORE UPDATE ON bulletin_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_bulletin_posts_updated_at();

-- RLSポリシーを設定
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;

-- 全員がSELECT可能（学生も見れるように）
CREATE POLICY "Anyone can view bulletin posts"
  ON bulletin_posts
  FOR SELECT
  USING (true);

-- 管理者のみINSERT/UPDATE/DELETE可能
CREATE POLICY "Admins can insert bulletin posts"
  ON bulletin_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update bulletin posts"
  ON bulletin_posts
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete bulletin posts"
  ON bulletin_posts
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- コメントを追加
COMMENT ON TABLE bulletin_posts IS '掲示板の投稿を保存するテーブル';
COMMENT ON COLUMN bulletin_posts.title IS '投稿のタイトル';
COMMENT ON COLUMN bulletin_posts.content IS '投稿の内容';
COMMENT ON COLUMN bulletin_posts.author_id IS '投稿者のユーザーID';
COMMENT ON COLUMN bulletin_posts.is_pinned IS 'ピン留め投稿かどうか';
COMMENT ON COLUMN bulletin_posts.display_order IS '表示順序（数値が小さいほど上に表示）';


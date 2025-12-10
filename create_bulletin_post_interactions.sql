-- 掲示板投稿のいいね（お気に入り）テーブル
CREATE TABLE IF NOT EXISTS bulletin_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_bulletin_post_likes_user_id ON bulletin_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_post_likes_post_id ON bulletin_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_post_likes_user_post ON bulletin_post_likes(user_id, post_id);

-- 掲示板投稿の保存（ブックマーク）テーブル
CREATE TABLE IF NOT EXISTS bulletin_post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_bulletin_post_saves_user_id ON bulletin_post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_post_saves_post_id ON bulletin_post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_post_saves_user_post ON bulletin_post_saves(user_id, post_id);

-- 掲示板投稿のコメントテーブル
CREATE TABLE IF NOT EXISTS bulletin_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_bulletin_post_comments_post_id ON bulletin_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_post_comments_user_id ON bulletin_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_post_comments_created_at ON bulletin_post_comments(created_at DESC);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_bulletin_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bulletin_post_comments_updated_at ON bulletin_post_comments;
CREATE TRIGGER update_bulletin_post_comments_updated_at
  BEFORE UPDATE ON bulletin_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_bulletin_post_comments_updated_at();

-- RLSポリシーを設定
ALTER TABLE bulletin_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_post_comments ENABLE ROW LEVEL SECURITY;

-- いいねテーブルのポリシー
DROP POLICY IF EXISTS "Anyone can view bulletin post likes" ON bulletin_post_likes;
CREATE POLICY "Anyone can view bulletin post likes"
  ON bulletin_post_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage bulletin post likes" ON bulletin_post_likes;
CREATE POLICY "Authenticated users can manage bulletin post likes"
  ON bulletin_post_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 保存テーブルのポリシー
DROP POLICY IF EXISTS "Anyone can view bulletin post saves" ON bulletin_post_saves;
CREATE POLICY "Anyone can view bulletin post saves"
  ON bulletin_post_saves
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage bulletin post saves" ON bulletin_post_saves;
CREATE POLICY "Authenticated users can manage bulletin post saves"
  ON bulletin_post_saves
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- コメントテーブルのポリシー
DROP POLICY IF EXISTS "Anyone can view bulletin post comments" ON bulletin_post_comments;
CREATE POLICY "Anyone can view bulletin post comments"
  ON bulletin_post_comments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert bulletin post comments" ON bulletin_post_comments;
CREATE POLICY "Authenticated users can insert bulletin post comments"
  ON bulletin_post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bulletin post comments" ON bulletin_post_comments;
CREATE POLICY "Users can update own bulletin post comments"
  ON bulletin_post_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bulletin post comments" ON bulletin_post_comments;
CREATE POLICY "Users can delete own bulletin post comments"
  ON bulletin_post_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- コメントを追加
COMMENT ON TABLE bulletin_post_likes IS '掲示板投稿へのいいね（お気に入り）';
COMMENT ON TABLE bulletin_post_saves IS '掲示板投稿の保存（ブックマーク）';
COMMENT ON TABLE bulletin_post_comments IS '掲示板投稿へのコメント';


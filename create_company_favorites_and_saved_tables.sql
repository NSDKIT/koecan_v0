-- ============================================
-- 企業のお気に入り（いいね）と保存（ブックマーク）機能のセットアップSQL
-- 実行順序: このファイルをSupabaseのSQL Editorで実行してください
-- ============================================

-- 1. 企業のお気に入り（いいね）テーブルを作成
CREATE TABLE IF NOT EXISTS company_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_company_favorites_user_id ON company_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_company_favorites_company_id ON company_favorites(company_id);
CREATE INDEX IF NOT EXISTS idx_company_favorites_user_company ON company_favorites(user_id, company_id);

-- コメントを追加
COMMENT ON TABLE company_favorites IS '学生が企業にいいね（お気に入り）した記録';
COMMENT ON COLUMN company_favorites.user_id IS '学生のユーザーID';
COMMENT ON COLUMN company_favorites.company_id IS '企業（advertisement）のID';

-- 2. 企業の保存（ブックマーク）テーブルを作成
CREATE TABLE IF NOT EXISTS company_saved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_company_saved_user_id ON company_saved(user_id);
CREATE INDEX IF NOT EXISTS idx_company_saved_company_id ON company_saved(company_id);
CREATE INDEX IF NOT EXISTS idx_company_saved_user_company ON company_saved(user_id, company_id);

-- コメントを追加
COMMENT ON TABLE company_saved IS '学生が企業を保存（検討リスト）した記録';
COMMENT ON COLUMN company_saved.user_id IS '学生のユーザーID';
COMMENT ON COLUMN company_saved.company_id IS '企業（advertisement）のID';

-- 3. RLS（Row Level Security）を有効化
ALTER TABLE company_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_saved ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシーを設定（company_favorites）
-- 学生は自分のお気に入りのみ閲覧可能
CREATE POLICY "Users can view own favorites" ON company_favorites
  FOR SELECT TO authenticated
  USING (user_id = uid());

-- 学生は自分のお気に入りのみ追加可能
CREATE POLICY "Users can create own favorites" ON company_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = uid());

-- 学生は自分のお気に入りのみ削除可能
CREATE POLICY "Users can delete own favorites" ON company_favorites
  FOR DELETE TO authenticated
  USING (user_id = uid());

-- 5. RLSポリシーを設定（company_saved）
-- 学生は自分の保存のみ閲覧可能
CREATE POLICY "Users can view own saved" ON company_saved
  FOR SELECT TO authenticated
  USING (user_id = uid());

-- 学生は自分の保存のみ追加可能
CREATE POLICY "Users can create own saved" ON company_saved
  FOR INSERT TO authenticated
  WITH CHECK (user_id = uid());

-- 学生は自分の保存のみ削除可能
CREATE POLICY "Users can delete own saved" ON company_saved
  FOR DELETE TO authenticated
  USING (user_id = uid());

-- ============================================
-- 確認クエリ（実行後、以下で確認できます）
-- ============================================
-- お気に入りテーブルの確認
-- SELECT * FROM company_favorites LIMIT 10;

-- 保存テーブルの確認
-- SELECT * FROM company_saved LIMIT 10;

-- テーブル構造の確認
-- \d company_favorites
-- \d company_saved


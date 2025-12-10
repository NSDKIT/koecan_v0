-- 掲示板の投稿にカテゴリーカラムを追加
ALTER TABLE bulletin_posts 
ADD COLUMN IF NOT EXISTS category TEXT;

-- カテゴリーの制約を追加（就活、サークル、学生イベント、バイト、雑談）
ALTER TABLE bulletin_posts
ADD CONSTRAINT check_category 
CHECK (category IS NULL OR category IN ('就活', 'サークル', '学生イベント', 'バイト', '雑談'));

-- コメントを追加
COMMENT ON COLUMN bulletin_posts.category IS '投稿のカテゴリー（就活、サークル、学生イベント、バイト、雑談）';


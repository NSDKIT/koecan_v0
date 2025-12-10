-- 掲示板の投稿にカテゴリーカラムを追加
-- テーブルが存在することを確認
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bulletin_posts') THEN
    -- カテゴリーカラムを追加（存在しない場合）
    ALTER TABLE bulletin_posts 
    ADD COLUMN IF NOT EXISTS category TEXT;

    -- 既存の制約を削除（存在する場合）
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'check_category' 
      AND conrelid = 'bulletin_posts'::regclass
    ) THEN
      ALTER TABLE bulletin_posts DROP CONSTRAINT check_category;
    END IF;

    -- カテゴリーの制約を追加（就活、サークル、学生イベント、バイト、雑談）
    ALTER TABLE bulletin_posts
    ADD CONSTRAINT check_category 
    CHECK (category IS NULL OR category IN ('就活', 'サークル', '学生イベント', 'バイト', '雑談'));

    -- コメントを追加
    COMMENT ON COLUMN bulletin_posts.category IS '投稿のカテゴリー（就活、サークル、学生イベント、バイト、雑談）';
    
    RAISE NOTICE 'カテゴリーカラムを追加しました';
  ELSE
    RAISE NOTICE 'bulletin_postsテーブルが存在しません。まず create_bulletin_board_table.sql を実行してください。';
  END IF;
END $$;


-- 掲示板テーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS bulletin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- カテゴリーカラムを追加（存在しない場合）
ALTER TABLE bulletin_posts 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 既存の制約を削除（存在する場合）
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_category' 
    AND conrelid = 'bulletin_posts'::regclass
  ) THEN
    ALTER TABLE bulletin_posts DROP CONSTRAINT check_category;
  END IF;
END $$;

-- カテゴリーの制約を追加
ALTER TABLE bulletin_posts
ADD CONSTRAINT check_category 
CHECK (category IS NULL OR category IN ('就活', 'サークル', '学生イベント', 'バイト', '雑談'));

-- インデックスを追加（存在しない場合）
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_display_order ON bulletin_posts(display_order DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_author_id ON bulletin_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_is_pinned ON bulletin_posts(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_category ON bulletin_posts(category);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_bulletin_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bulletin_posts_updated_at ON bulletin_posts;
CREATE TRIGGER update_bulletin_posts_updated_at
  BEFORE UPDATE ON bulletin_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_bulletin_posts_updated_at();

-- RLSポリシーを設定
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Anyone can view bulletin posts" ON bulletin_posts;
DROP POLICY IF EXISTS "Admins can insert bulletin posts" ON bulletin_posts;
DROP POLICY IF EXISTS "Admins can update bulletin posts" ON bulletin_posts;
DROP POLICY IF EXISTS "Admins can delete bulletin posts" ON bulletin_posts;

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
COMMENT ON COLUMN bulletin_posts.category IS '投稿のカテゴリー（就活、サークル、学生イベント、バイト、雑談）';

-- ダミーデータを追加（既にデータが存在する場合はスキップ）
-- 注意: author_idは実際の管理者ユーザーIDに置き換えてください
DO $$
DECLARE
  admin_user_id UUID;
  post_count INTEGER;
BEGIN
  -- 管理者ユーザーを取得
  SELECT id INTO admin_user_id FROM users WHERE email LIKE '%admin%' LIMIT 1;
  
  -- 既存の投稿数を確認
  SELECT COUNT(*) INTO post_count FROM bulletin_posts;
  
  -- 管理者が存在し、投稿が0件の場合のみダミーデータを追加
  IF admin_user_id IS NOT NULL AND post_count = 0 THEN
    -- 就活（合同説明会・インターンシップ）
    INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
    VALUES 
      (
        '合同説明会のお知らせ',
        '来月、大手企業による合同説明会を開催します。' || E'\n\n' || 
        '日時: 2024年12月15日（日）10:00-17:00' || E'\n' ||
        '場所: 大学講堂' || E'\n\n' ||
        '参加企業:' || E'\n' ||
        '- 株式会社A' || E'\n' ||
        '- 株式会社B' || E'\n' ||
        '- 株式会社C' || E'\n\n' ||
        '事前登録が必要です。詳細は学生課までお問い合わせください。',
        admin_user_id,
        false,
        1,
        '就活',
        NOW() - INTERVAL '2 days'
      ),
      (
        'インターンシップ募集開始',
        '2025年夏期インターンシップの募集を開始しました。' || E'\n\n' ||
        '対象: 2年生以上' || E'\n' ||
        '期間: 2025年7月-8月（2週間〜1ヶ月）' || E'\n\n' ||
        '応募方法:' || E'\n' ||
        '1. エントリーフォームに記入' || E'\n' ||
        '2. 履歴書を提出' || E'\n' ||
        '3. 面接' || E'\n\n' ||
        '締切: 2025年1月31日' || E'\n\n' ||
        '詳細は就職支援課まで。',
        admin_user_id,
        false,
        2,
        '就活',
        NOW() - INTERVAL '5 days'
      );

    -- サークル
    INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
    VALUES 
      (
        'テニスサークル新メンバー募集',
        'テニスサークルでは新メンバーを募集しています！' || E'\n\n' ||
        '活動内容:' || E'\n' ||
        '- 週2回の練習（水曜・土曜）' || E'\n' ||
        '- 月1回の大会参加' || E'\n' ||
        '- 合宿（年2回）' || E'\n\n' ||
        '初心者大歓迎！ラケットは貸し出し可能です。' || E'\n\n' ||
        '見学も随時受け付けています。' || E'\n' ||
        '連絡先: tennis@example.com',
        admin_user_id,
        false,
        3,
        'サークル',
        NOW() - INTERVAL '3 days'
      );

    -- 学生イベント
    INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
    VALUES 
      (
        '学園祭実行委員会メンバー募集',
        '来年の学園祭に向けて、実行委員会のメンバーを募集しています！' || E'\n\n' ||
        '活動内容:' || E'\n' ||
        '- 企画立案' || E'\n' ||
        '- 準備作業' || E'\n' ||
        '- 当日の運営' || E'\n\n' ||
        'やりがいのある活動です。ぜひご参加ください！' || E'\n\n' ||
        '説明会: 12月10日（火）18:00〜' || E'\n' ||
        '場所: 学生ホール',
        admin_user_id,
        false,
        4,
        '学生イベント',
        NOW() - INTERVAL '1 day'
      );

    -- バイト
    INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
    VALUES 
      (
        'カフェスタッフ募集',
        '大学近くのカフェでスタッフを募集しています。' || E'\n\n' ||
        '時給: 1,200円' || E'\n' ||
        '勤務時間: 週3回以上、1回3時間以上' || E'\n\n' ||
        '条件:' || E'\n' ||
        '- 接客が好きな方' || E'\n' ||
        '- 明るく元気な方' || E'\n' ||
        '- 長期勤務可能な方' || E'\n\n' ||
        '詳細は店舗まで直接お問い合わせください。' || E'\n' ||
        'TEL: 03-XXXX-XXXX',
        admin_user_id,
        false,
        5,
        'バイト',
        NOW() - INTERVAL '4 days'
      );

    -- 雑談
    INSERT INTO bulletin_posts (title, content, author_id, is_pinned, display_order, category, created_at)
    VALUES 
      (
        '勉強会を開催します',
        'プログラミング勉強会を開催します！' || E'\n\n' ||
        '内容:' || E'\n' ||
        '- Web開発の基礎' || E'\n' ||
        '- 実践的なプロジェクト作成' || E'\n' ||
        '- コードレビュー' || E'\n\n' ||
        '日時: 毎週金曜日 19:00-21:00' || E'\n' ||
        '場所: 情報処理教室' || E'\n\n' ||
        '初心者から上級者まで、どなたでも参加可能です。' || E'\n' ||
        '興味のある方は気軽に参加してください！',
        admin_user_id,
        false,
        6,
        '雑談',
        NOW() - INTERVAL '6 days'
      );
    
    RAISE NOTICE 'ダミーデータを追加しました';
  ELSE
    IF admin_user_id IS NULL THEN
      RAISE NOTICE '管理者ユーザーが見つかりませんでした。author_idを手動で設定してください。';
    END IF;
    IF post_count > 0 THEN
      RAISE NOTICE '既に投稿が存在するため、ダミーデータは追加されませんでした。';
    END IF;
  END IF;
END $$;


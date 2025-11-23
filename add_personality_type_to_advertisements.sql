-- advertisementsテーブルにpersonality_typeカラムを追加
ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS personality_type TEXT;

-- コメントを追加
COMMENT ON COLUMN advertisements.personality_type IS '企業のパーソナリティタイプ（例: ENPF, ISRO等）';


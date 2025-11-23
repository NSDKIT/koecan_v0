-- ============================================
-- パーソナリティ診断データの移行
-- ============================================
-- 既存の1〜5の値を-2〜+2に変換してから
-- CHECK制約を更新します
-- ============================================

-- 1. 既存データの確認
SELECT 
  COUNT(*) AS "総レコード数",
  MIN(answer) AS "最小値",
  MAX(answer) AS "最大値",
  COUNT(*) FILTER (WHERE answer BETWEEN 1 AND 5) AS "1〜5のレコード数",
  COUNT(*) FILTER (WHERE answer BETWEEN -2 AND 2) AS "-2〜+2のレコード数"
FROM monitor_personality_responses;

-- 2. 既存データを1〜5から-2〜+2に変換
-- 変換式: answer = answer - 3
-- 1 → -2, 2 → -1, 3 → 0, 4 → +1, 5 → +2
UPDATE monitor_personality_responses
SET answer = answer - 3
WHERE answer BETWEEN 1 AND 5;

-- 3. 変換後のデータ確認
SELECT 
  COUNT(*) AS "総レコード数",
  MIN(answer) AS "最小値",
  MAX(answer) AS "最大値",
  COUNT(*) FILTER (WHERE answer = -2) AS "-2の数",
  COUNT(*) FILTER (WHERE answer = -1) AS "-1の数",
  COUNT(*) FILTER (WHERE answer = 0) AS "0の数",
  COUNT(*) FILTER (WHERE answer = 1) AS "+1の数",
  COUNT(*) FILTER (WHERE answer = 2) AS "+2の数"
FROM monitor_personality_responses;

-- 4. 既存のCHECK制約を削除
ALTER TABLE monitor_personality_responses 
  DROP CONSTRAINT IF EXISTS monitor_personality_responses_answer_check;

-- 5. 新しいCHECK制約を追加（-2〜+2）
ALTER TABLE monitor_personality_responses 
  ADD CONSTRAINT monitor_personality_responses_answer_check 
  CHECK (answer >= -2 AND answer <= 2);

-- 6. 最終確認
SELECT 
  conname AS "制約名",
  contype AS "制約タイプ",
  pg_get_constraintdef(oid) AS "制約定義"
FROM pg_constraint
WHERE conrelid = 'public.monitor_personality_responses'::regclass
  AND conname = 'monitor_personality_responses_answer_check';


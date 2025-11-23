-- ============================================
-- パーソナリティ診断テーブルのCHECK制約を更新
-- ============================================
-- answerカラムの制約を1〜5から-2〜+2に変更します
-- 【重要】既存データがある場合は、先にmigrate_personality_assessment_data.sqlを実行してください
-- ============================================

-- 1. 既存のCHECK制約を削除（UPDATEの前に削除する必要がある）
ALTER TABLE monitor_personality_responses 
  DROP CONSTRAINT IF EXISTS monitor_personality_responses_answer_check;

-- 2. 既存データを1〜5から-2〜+2に変換
-- 変換式: answer = answer - 3
-- 1 → -2, 2 → -1, 3 → 0, 4 → +1, 5 → +2
UPDATE monitor_personality_responses
SET answer = answer - 3
WHERE answer BETWEEN 1 AND 5;

-- 3. 新しいCHECK制約を追加（-2〜+2）
ALTER TABLE monitor_personality_responses 
  ADD CONSTRAINT monitor_personality_responses_answer_check 
  CHECK (answer >= -2 AND answer <= 2);

-- ============================================
-- 確認クエリ
-- ============================================
-- 以下のクエリで、制約が正しく更新されたか確認してください：

-- SELECT 
--   conname AS "制約名",
--   contype AS "制約タイプ",
--   pg_get_constraintdef(oid) AS "制約定義"
-- FROM pg_constraint
-- WHERE conrelid = 'public.monitor_personality_responses'::regclass
--   AND conname = 'monitor_personality_responses_answer_check';


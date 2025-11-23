-- ============================================
-- パーソナリティ診断テーブルの確認
-- ============================================
-- テーブルが正しく作成されたか確認します
-- ============================================

-- 1. テーブル構造の確認
SELECT 
  column_name AS "カラム名",
  data_type AS "データ型",
  is_nullable AS "NULL許可",
  column_default AS "デフォルト値"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'monitor_personality_responses'
ORDER BY ordinal_position;

-- 2. 制約の確認
SELECT 
  conname AS "制約名",
  contype AS "制約タイプ",
  pg_get_constraintdef(oid) AS "制約定義"
FROM pg_constraint
WHERE conrelid = 'public.monitor_personality_responses'::regclass
ORDER BY contype, conname;

-- 3. RLSポリシーの確認
SELECT 
  policyname AS "ポリシー名",
  cmd AS "操作",
  roles AS "ロール",
  qual AS "USING句",
  with_check AS "WITH CHECK句"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'monitor_personality_responses'
ORDER BY cmd, policyname;

-- 4. インデックスの確認
SELECT 
  indexname AS "インデックス名",
  indexdef AS "定義"
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'monitor_personality_responses';

-- 5. トリガーの確認
SELECT 
  tgname AS "トリガー名",
  CASE 
    WHEN tgenabled = 'O' THEN '✅ 有効'
    WHEN tgenabled = 'D' THEN '❌ 無効'
    ELSE '不明'
  END AS "状態",
  pg_get_triggerdef(oid) AS "定義"
FROM pg_trigger
WHERE tgrelid = 'public.monitor_personality_responses'::regclass
ORDER BY tgname;


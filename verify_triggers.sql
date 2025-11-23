-- ============================================
-- トリガーの確認
-- ============================================
-- fix_triggers_for_points.sql実行後、
-- トリガーが正しく作成されたか確認します
-- ============================================

-- 1. トリガーの存在と状態を確認
SELECT 
  tgname AS "トリガー名",
  CASE 
    WHEN tgenabled = 'O' THEN '✅ 有効'
    WHEN tgenabled = 'D' THEN '❌ 無効'
    ELSE '不明'
  END AS "状態",
  pg_get_triggerdef(oid) AS "定義"
FROM pg_trigger
WHERE tgrelid = 'public.responses'::regclass
  AND tgname IN ('set_response_points_trigger', 'update_monitor_points_trigger')
ORDER BY tgname;

-- 2. トリガー関数の存在確認
SELECT 
  proname AS "関数名",
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '❌ SECURITY INVOKER'
  END AS "セキュリティ属性",
  prosrc AS "関数定義"
FROM pg_proc
WHERE proname IN ('set_response_points', 'update_monitor_points')
ORDER BY proname;

-- 3. 関数の詳細情報
SELECT 
  p.proname AS "関数名",
  pg_get_functiondef(p.oid) AS "完全な関数定義"
FROM pg_proc p
WHERE p.proname IN ('set_response_points', 'update_monitor_points')
ORDER BY p.proname;


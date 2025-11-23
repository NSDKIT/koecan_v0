-- ============================================
-- トリガーとポイント更新の診断・修正
-- ============================================
-- ポイントが反映されない問題を診断し、必要に応じて修正します
-- ============================================

-- ============================================
-- 1. トリガーの存在確認
-- ============================================
SELECT 
  tgname AS "トリガー名",
  tgtype::text AS "タイプ",
  tgenabled AS "有効",
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

-- ============================================
-- 2. トリガー関数の存在確認
-- ============================================
SELECT 
  proname AS "関数名",
  prosrc AS "関数定義"
FROM pg_proc
WHERE proname IN ('set_response_points', 'update_monitor_points')
ORDER BY proname;

-- ============================================
-- 3. 最近のresponsesレコードとポイント更新状況を確認
-- ============================================
SELECT 
  r.id AS response_id,
  r.survey_id,
  r.monitor_id,
  r.points_earned,
  r.completed_at,
  s.points_reward AS survey_points_reward,
  mp.points AS current_monitor_points,
  mp.user_id,
  CASE 
    WHEN mp.points IS NULL THEN '❌ monitor_profilesレコードが存在しません'
    WHEN r.points_earned IS NULL THEN '❌ points_earnedが設定されていません'
    WHEN r.points_earned != s.points_reward THEN '⚠️ points_earnedとsurvey_points_rewardが一致しません'
    ELSE '✅ 正常'
  END AS "状態"
FROM responses r
LEFT JOIN surveys s ON r.survey_id = s.id
LEFT JOIN monitor_profiles mp ON r.monitor_id = mp.user_id
ORDER BY r.completed_at DESC
LIMIT 10;

-- ============================================
-- 4. トリガーが存在しない場合の再作成
-- ============================================
-- 以下のコメントを外して実行してください（必要に応じて）

-- トリガー関数の再作成
CREATE OR REPLACE FUNCTION set_response_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.points_earned := (SELECT points_reward FROM surveys WHERE id = NEW.survey_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_monitor_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update monitor points
  UPDATE monitor_profiles 
  SET points = points + NEW.points_earned 
  WHERE user_id = NEW.monitor_id;
  
  -- Create point transaction record
  INSERT INTO point_transactions (monitor_id, survey_id, points, transaction_type)
  VALUES (NEW.monitor_id, NEW.survey_id, NEW.points_earned, 'earned');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- SECURITY DEFINERを追加してRLSを回避

-- トリガーの再作成
DROP TRIGGER IF EXISTS set_response_points_trigger ON responses;
CREATE TRIGGER set_response_points_trigger 
  BEFORE INSERT ON responses 
  FOR EACH ROW 
  EXECUTE FUNCTION set_response_points();

DROP TRIGGER IF EXISTS update_monitor_points_trigger ON responses;
CREATE TRIGGER update_monitor_points_trigger 
  AFTER INSERT ON responses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_monitor_points();

-- ============================================
-- 5. 手動でポイントを修正（過去のレコード用）
-- ============================================
-- 以下のクエリで、過去のresponsesレコードからポイントを再計算します
-- 注意: 既にポイントが加算されている場合は重複加算になる可能性があります

-- まず、現在の状況を確認
SELECT 
  r.monitor_id,
  mp.points AS current_points,
  SUM(r.points_earned) AS total_earned_points,
  COUNT(*) AS response_count
FROM responses r
LEFT JOIN monitor_profiles mp ON r.monitor_id = mp.user_id
WHERE r.points_earned > 0
GROUP BY r.monitor_id, mp.points
ORDER BY r.monitor_id;

-- 手動でポイントを更新する場合（慎重に実行してください）
-- UPDATE monitor_profiles mp
-- SET points = (
--   SELECT COALESCE(SUM(r.points_earned), 0)
--   FROM responses r
--   WHERE r.monitor_id = mp.user_id
-- )
-- WHERE EXISTS (
--   SELECT 1 FROM responses r WHERE r.monitor_id = mp.user_id
-- );


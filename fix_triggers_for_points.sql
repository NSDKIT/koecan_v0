-- ============================================
-- ポイント更新トリガーの修正
-- ============================================
-- ポイントが反映されない問題を修正します
-- ============================================

-- 【重要】実行前に確認
-- check_triggers_and_fix_points.sqlを実行して、現在の状態を確認してください

-- ============================================
-- 1. トリガー関数の再作成（SECURITY DEFINER付き）
-- ============================================
-- SECURITY DEFINERを追加することで、RLSポリシーを回避して
-- monitor_profilesテーブルを更新できるようにします

-- set_response_points関数の再作成
CREATE OR REPLACE FUNCTION set_response_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.points_earned := (SELECT points_reward FROM surveys WHERE id = NEW.survey_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- update_monitor_points関数の再作成（SECURITY DEFINER付き）
CREATE OR REPLACE FUNCTION update_monitor_points()
RETURNS TRIGGER AS $$
DECLARE
  affected_rows integer;
BEGIN
  -- Update monitor points
  -- SECURITY DEFINERにより、RLSポリシーを回避して更新可能
  UPDATE monitor_profiles 
  SET points = points + NEW.points_earned 
  WHERE user_id = NEW.monitor_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- monitor_profilesレコードが存在しない場合、エラーログを出力
  IF affected_rows = 0 THEN
    RAISE WARNING 'monitor_profilesレコードが見つかりませんでした。user_id: %, survey_id: %', NEW.monitor_id, NEW.survey_id;
    -- レコードが存在しない場合は、デフォルト値で作成を試みる（オプション）
    -- INSERT INTO monitor_profiles (user_id, age, points, created_at, updated_at)
    -- VALUES (NEW.monitor_id, 0, NEW.points_earned, NOW(), NOW())
    -- ON CONFLICT (user_id) DO UPDATE SET points = monitor_profiles.points + NEW.points_earned;
  END IF;
  
  -- Create point transaction record
  INSERT INTO point_transactions (monitor_id, survey_id, points, transaction_type)
  VALUES (NEW.monitor_id, NEW.survey_id, NEW.points_earned, 'earned')
  ON CONFLICT DO NOTHING;  -- 重複を防ぐ
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- 重要: SECURITY DEFINERを追加

-- ============================================
-- 2. トリガーの再作成
-- ============================================

-- set_response_points_triggerの再作成
DROP TRIGGER IF EXISTS set_response_points_trigger ON responses;
CREATE TRIGGER set_response_points_trigger 
  BEFORE INSERT ON responses 
  FOR EACH ROW 
  EXECUTE FUNCTION set_response_points();

-- update_monitor_points_triggerの再作成
DROP TRIGGER IF EXISTS update_monitor_points_trigger ON responses;
CREATE TRIGGER update_monitor_points_trigger 
  AFTER INSERT ON responses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_monitor_points();

-- ============================================
-- 3. 確認クエリ
-- ============================================
-- 以下のクエリで、トリガーが正しく作成されたか確認してください：

-- SELECT 
--   tgname AS "トリガー名",
--   CASE 
--     WHEN tgenabled = 'O' THEN '✅ 有効'
--     WHEN tgenabled = 'D' THEN '❌ 無効'
--     ELSE '不明'
--   END AS "状態",
--   pg_get_triggerdef(oid) AS "定義"
-- FROM pg_trigger
-- WHERE tgrelid = 'public.responses'::regclass
--   AND tgname IN ('set_response_points_trigger', 'update_monitor_points_trigger')
-- ORDER BY tgname;

-- ============================================
-- 4. テスト用クエリ（オプション）
-- ============================================
-- 以下のクエリで、トリガーが正しく動作するかテストできます
-- （実際のresponsesレコードは作成されません）

-- テスト用の一時テーブルを作成してテストする場合は、
-- 実際のresponsesテーブルでテストINSERTを実行してください


/*
  # 新規登録100ポイントボーナスの実装

  1. 機能追加
    - モニター新規登録時に確実に100ポイントを付与
    - ポイント取引履歴の記録
    - サインアップボーナス用の関数を改善

  2. 変更内容
    - `grant_signup_bonus` 関数を更新して確実に100ポイントを付与
    - ポイント取引履歴にサインアップボーナスを記録
    - エラーハンドリングを追加
*/

-- サインアップボーナス付与関数を更新
CREATE OR REPLACE FUNCTION grant_signup_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- モニタープロファイルに100ポイントを設定
  NEW.points := 100;
  
  -- ポイント取引履歴にサインアップボーナスを記録
  INSERT INTO point_transactions (
    monitor_id, 
    survey_id, 
    points, 
    transaction_type
  ) VALUES (
    NEW.user_id, 
    NULL, 
    100, 
    'earned'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもプロファイル作成は継続
    NEW.points := 100;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを確認し、必要に応じて再作成
DROP TRIGGER IF EXISTS grant_signup_bonus_trigger ON monitor_profiles;
CREATE TRIGGER grant_signup_bonus_trigger 
  BEFORE INSERT ON monitor_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION grant_signup_bonus();

-- 既存のモニターで0ポイントの場合は100ポイントに更新
UPDATE monitor_profiles 
SET points = 100 
WHERE points = 0;

-- 既存のモニターでポイント取引履歴がない場合はサインアップボーナスを追加
INSERT INTO point_transactions (monitor_id, survey_id, points, transaction_type)
SELECT 
  mp.user_id,
  NULL,
  100,
  'earned'
FROM monitor_profiles mp
LEFT JOIN point_transactions pt ON mp.user_id = pt.monitor_id
WHERE pt.monitor_id IS NULL;
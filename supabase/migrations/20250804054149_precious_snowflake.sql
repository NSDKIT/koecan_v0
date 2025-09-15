/*
  # 新規登録ボーナスポイント機能

  1. 新機能
    - 新規モニター登録時に100ポイントを自動付与
    - ポイント取引履歴に「新規登録ボーナス」として記録

  2. 実装内容
    - monitor_profiles作成時のトリガー関数
    - 自動的なポイント付与とトランザクション記録
*/

-- 新規登録ボーナスポイントを付与する関数
CREATE OR REPLACE FUNCTION grant_signup_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規モニターに100ポイントを付与
  NEW.points := 100;
  
  -- ポイント取引履歴に記録
  INSERT INTO point_transactions (
    monitor_id, 
    survey_id, 
    points, 
    transaction_type,
    created_at
  ) VALUES (
    NEW.user_id,
    NULL, -- survey_idはNULL（新規登録ボーナスのため）
    100,
    'earned',
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- monitor_profiles作成時に新規登録ボーナスを付与するトリガー
CREATE TRIGGER grant_signup_bonus_trigger
  BEFORE INSERT ON monitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION grant_signup_bonus();

-- 既存のモニターにも遡って100ポイントを付与（一度だけ実行）
DO $$
DECLARE
  monitor_record RECORD;
BEGIN
  -- 既存のモニターで、まだボーナスを受け取っていない人に付与
  FOR monitor_record IN 
    SELECT mp.user_id, mp.monitor_id
    FROM monitor_profiles mp
    LEFT JOIN point_transactions pt ON pt.monitor_id = mp.user_id AND pt.survey_id IS NULL
    WHERE pt.id IS NULL -- まだボーナスを受け取っていない
  LOOP
    -- ポイントを追加
    UPDATE monitor_profiles 
    SET points = points + 100 
    WHERE user_id = monitor_record.user_id;
    
    -- トランザクション記録を追加
    INSERT INTO point_transactions (
      monitor_id, 
      survey_id, 
      points, 
      transaction_type,
      created_at
    ) VALUES (
      monitor_record.user_id,
      NULL,
      100,
      'earned',
      now()
    );
  END LOOP;
END $$;
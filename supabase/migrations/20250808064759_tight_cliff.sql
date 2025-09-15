/*
  # 管理者機能に必要な追加関数とRPC

  1. 登録番号使用関数
  2. 管理者権限チェック関数の改善
  3. ポイント交換処理関数
*/

-- 登録番号使用関数（クライアント登録時に使用）
CREATE OR REPLACE FUNCTION use_registration_code(
  p_code text,
  p_user_id uuid
)
RETURNS json AS $$
DECLARE
  code_record record;
  result json;
BEGIN
  -- 登録番号を検索
  SELECT * INTO code_record
  FROM client_registration_codes
  WHERE code = p_code AND NOT is_used;
  
  -- 登録番号が見つからない場合
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '登録番号が無効または既に使用されています'
    );
  END IF;
  
  -- 一時的なユーザーIDの場合は検証のみ
  IF p_user_id = '00000000-0000-0000-0000-000000000000' THEN
    RETURN json_build_object(
      'success', true,
      'company_name', code_record.company_name,
      'industry', code_record.industry
    );
  END IF;
  
  -- 登録番号を使用済みにマーク
  UPDATE client_registration_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now()
  WHERE id = code_record.id;
  
  RETURN json_build_object(
    'success', true,
    'company_name', code_record.company_name,
    'industry', code_record.industry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者権限チェック関数の改善
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  -- メールアドレスベースの管理者チェック
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'admin@example.com'
  ) OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR email = 'admin@example.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ポイント交換処理時のポイント減算関数
CREATE OR REPLACE FUNCTION process_point_exchange(
  p_request_id uuid,
  p_status text
)
RETURNS json AS $$
DECLARE
  exchange_record record;
  result json;
BEGIN
  -- 交換リクエストを取得
  SELECT * INTO exchange_record
  FROM point_exchange_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '処理対象のリクエストが見つかりません'
    );
  END IF;
  
  -- ステータスを更新
  UPDATE point_exchange_requests
  SET 
    status = p_status,
    processed_at = now()
  WHERE id = p_request_id;
  
  -- 完了の場合はポイントを減算
  IF p_status = 'completed' THEN
    UPDATE monitor_profiles
    SET points = points - exchange_record.points_amount
    WHERE user_id = exchange_record.monitor_id;
    
    -- ポイント取引記録を作成
    INSERT INTO point_transactions (
      monitor_id,
      points,
      transaction_type,
      created_at
    ) VALUES (
      exchange_record.monitor_id,
      -exchange_record.points_amount,
      'redeemed',
      now()
    );
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規登録ボーナス付与関数
CREATE OR REPLACE FUNCTION grant_signup_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規登録時に100ポイントを付与
  NEW.points := 100;
  
  -- ポイント取引記録を作成
  INSERT INTO point_transactions (
    monitor_id,
    points,
    transaction_type,
    created_at
  ) VALUES (
    NEW.user_id,
    100,
    'earned',
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
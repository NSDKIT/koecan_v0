/*
  # 管理者認証の設定

  1. 既存の管理者ユーザーの確認
  2. 認証トリガーの設定
  3. 管理者権限の確保
*/

-- 既存の管理者ユーザーを確認
DO $$
BEGIN
  -- admin@example.com が存在しない場合のみ作成
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
    INSERT INTO users (id, email, role, name, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'admin@example.com',
      'admin',
      '管理者',
      now(),
      now()
    );
  ELSE
    -- 既存ユーザーの role を admin に更新
    UPDATE users 
    SET role = 'admin', name = '管理者', updated_at = now()
    WHERE email = 'admin@example.com';
  END IF;
END $$;

-- 管理者用の特別な認証処理関数
CREATE OR REPLACE FUNCTION handle_admin_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- admin@example.com の場合、既存のレコードを更新
  IF NEW.email = 'admin@example.com' THEN
    UPDATE users 
    SET id = NEW.id, updated_at = now()
    WHERE email = 'admin@example.com';
    
    -- 既に存在する場合は何もしない
    IF FOUND THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- 通常の新規ユーザー作成処理
  INSERT INTO users (id, email, role, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'monitor' -- デフォルト
    END,
    COALESCE(NEW.raw_user_meta_data->>'name', 'ユーザー'),
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーを削除して新しいものを作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_admin_auth();
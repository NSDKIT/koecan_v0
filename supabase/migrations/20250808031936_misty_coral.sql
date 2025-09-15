/*
  # クライアント登録番号機能の追加

  1. New Tables
    - `client_registration_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - 登録番号
      - `company_name` (text) - 会社名
      - `industry` (text) - 業界
      - `is_used` (boolean) - 使用済みフラグ
      - `used_by` (uuid) - 使用したユーザーID
      - `used_at` (timestamp) - 使用日時
      - `created_at` (timestamp)
      - `created_by` (uuid) - 作成した管理者ID

  2. Security
    - Enable RLS on `client_registration_codes` table
    - Add policies for admin management and client verification
*/

-- Create client registration codes table
CREATE TABLE IF NOT EXISTS client_registration_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  company_name text NOT NULL,
  industry text NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES users(id) ON DELETE SET NULL,
  used_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_registration_codes_code ON client_registration_codes(code);
CREATE INDEX IF NOT EXISTS idx_client_registration_codes_is_used ON client_registration_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_client_registration_codes_created_by ON client_registration_codes(created_by);

-- Enable Row Level Security
ALTER TABLE client_registration_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_registration_codes table
CREATE POLICY "Admins can manage all registration codes" ON client_registration_codes 
  FOR ALL TO authenticated 
  USING (is_admin());

CREATE POLICY "Users can verify registration codes" ON client_registration_codes 
  FOR SELECT TO authenticated 
  USING (NOT is_used OR used_by = uid());

-- Function to use registration code
CREATE OR REPLACE FUNCTION use_registration_code(
  p_code text,
  p_user_id uuid
) RETURNS json AS $$
DECLARE
  v_code_record client_registration_codes%ROWTYPE;
  v_result json;
BEGIN
  -- Check if code exists and is not used
  SELECT * INTO v_code_record
  FROM client_registration_codes
  WHERE code = p_code AND NOT is_used;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or already used registration code'
    );
  END IF;
  
  -- Mark code as used
  UPDATE client_registration_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now()
  WHERE code = p_code;
  
  -- Return success with company info
  RETURN json_build_object(
    'success', true,
    'company_name', v_code_record.company_name,
    'industry', v_code_record.industry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 登録番号「TKK9AFRJ」の詳細確認
SELECT 
  id,
  code,
  company_name,
  industry,
  is_used,
  used_by,
  used_at,
  created_at,
  created_by
FROM client_registration_codes 
WHERE code = 'TKK9AFRJ';

-- 全ての登録番号の状況確認
SELECT 
  code,
  company_name,
  industry,
  is_used,
  CASE 
    WHEN is_used THEN '使用済み'
    ELSE '未使用'
  END as status
FROM client_registration_codes 
ORDER BY created_at DESC
LIMIT 10;

-- テーブル全体の統計
SELECT 
  COUNT(*) as total_codes,
  COUNT(CASE WHEN is_used = false THEN 1 END) as unused_codes,
  COUNT(CASE WHEN is_used = true THEN 1 END) as used_codes
FROM client_registration_codes;
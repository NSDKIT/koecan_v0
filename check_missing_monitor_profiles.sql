-- ============================================
-- monitor_profilesが不足しているユーザーを確認
-- ============================================
-- usersテーブルに存在するが、monitor_profilesテーブルに
-- 存在しないmonitorユーザーを特定します
-- ============================================

-- 1. monitor_profilesが不足しているユーザーを確認
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.created_at AS user_created_at,
  CASE 
    WHEN mp.user_id IS NULL THEN '❌ 不足'
    ELSE '✅ 存在'
  END AS monitor_profile_status
FROM users u
LEFT JOIN monitor_profiles mp ON u.id = mp.user_id
WHERE u.role = 'monitor'
ORDER BY 
  CASE 
    WHEN mp.user_id IS NULL THEN 0
    ELSE 1
  END,
  u.created_at DESC;

-- 2. 不足しているユーザーの詳細情報
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.created_at AS user_created_at,
  'monitor_profilesレコードが存在しません' AS issue
FROM users u
LEFT JOIN monitor_profiles mp ON u.id = mp.user_id
WHERE u.role = 'monitor'
  AND mp.user_id IS NULL
ORDER BY u.created_at DESC;

-- 3. 統計情報
SELECT 
  COUNT(*) FILTER (WHERE mp.user_id IS NOT NULL) AS "monitor_profilesが存在するユーザー数",
  COUNT(*) FILTER (WHERE mp.user_id IS NULL) AS "monitor_profilesが不足しているユーザー数",
  COUNT(*) AS "monitorユーザー総数"
FROM users u
LEFT JOIN monitor_profiles mp ON u.id = mp.user_id
WHERE u.role = 'monitor';


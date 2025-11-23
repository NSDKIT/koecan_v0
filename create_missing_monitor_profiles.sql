-- ============================================
-- 不足しているmonitor_profilesレコードを作成
-- ============================================
-- usersテーブルに存在するが、monitor_profilesテーブルに
-- 存在しないmonitorユーザーに対して、デフォルトの
-- monitor_profilesレコードを作成します
-- ============================================

-- 【重要】実行前に確認
-- 以下のクエリで、不足しているユーザーを確認してください：
-- SELECT u.id, u.email, u.name 
-- FROM users u
-- LEFT JOIN monitor_profiles mp ON u.id = mp.user_id
-- WHERE u.role = 'monitor' AND mp.user_id IS NULL;

-- ============================================
-- 不足しているmonitor_profilesレコードを作成
-- ============================================
-- デフォルト値でmonitor_profilesレコードを作成します
-- 既存のレコードは更新されません（ON CONFLICT DO NOTHING）

INSERT INTO monitor_profiles (
  user_id,
  age,
  gender,
  occupation,
  location,
  points,
  created_at,
  updated_at
)
SELECT 
  u.id AS user_id,
  20 AS age,  -- デフォルト値（CHECK制約: age >= 18 AND age <= 100）
  NULL AS gender,  -- デフォルト値（後で更新可能）
  '学生' AS occupation,  -- デフォルト値（後で更新可能）
  NULL AS location,  -- デフォルト値（後で更新可能）
  0 AS points,  -- 初期ポイント
  NOW() AS created_at,
  NOW() AS updated_at
FROM users u
LEFT JOIN monitor_profiles mp ON u.id = mp.user_id
WHERE u.role = 'monitor'
  AND mp.user_id IS NULL  -- monitor_profilesが存在しないユーザーのみ
ON CONFLICT (user_id) DO NOTHING;  -- 既存のレコードは更新しない

-- ============================================
-- 確認クエリ
-- ============================================
-- 以下のクエリで、作成されたレコードを確認してください：
-- SELECT 
--   u.id,
--   u.email,
--   u.name,
--   mp.age,
--   mp.gender,
--   mp.occupation,
--   mp.location,
--   mp.points,
--   mp.created_at
-- FROM users u
-- INNER JOIN monitor_profiles mp ON u.id = mp.user_id
-- WHERE u.role = 'monitor'
-- ORDER BY mp.created_at DESC;


-- ============================================
-- 不足しているポイントの修正
-- ============================================
-- responsesテーブルから獲得ポイントを再計算し、
-- monitor_profilesテーブルのポイントを修正します
-- ============================================

-- ============================================
-- 1. 不足しているmonitor_profilesレコードを作成
-- ============================================
-- monitor_profilesレコードが存在しないユーザーに対して、
-- デフォルト値でレコードを作成します

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
SELECT DISTINCT
  r.monitor_id AS user_id,
  20 AS age,  -- デフォルト値（CHECK制約: age >= 18 AND age <= 100）
  NULL AS gender,  -- デフォルト値
  '学生' AS occupation,  -- デフォルト値
  NULL AS location,  -- デフォルト値
  0 AS points,  -- 初期ポイント（後で再計算）
  NOW() AS created_at,
  NOW() AS updated_at
FROM responses r
LEFT JOIN monitor_profiles mp ON r.monitor_id = mp.user_id
WHERE mp.user_id IS NULL  -- monitor_profilesが存在しないユーザーのみ
ON CONFLICT DO NOTHING;  -- 既存のレコードは更新しない

-- ============================================
-- 2. 獲得ポイントを再計算してmonitor_profilesを更新
-- ============================================
-- responsesテーブルから各ユーザーの獲得ポイント合計を計算し、
-- monitor_profilesテーブルのpointsカラムを更新します

UPDATE monitor_profiles mp
SET points = COALESCE((
  SELECT SUM(r.points_earned)
  FROM responses r
  WHERE r.monitor_id = mp.user_id
  AND r.points_earned IS NOT NULL
), 0)
WHERE EXISTS (
  SELECT 1 
  FROM responses r 
  WHERE r.monitor_id = mp.user_id
);

-- ============================================
-- 3. 確認クエリ
-- ============================================
-- 以下のクエリで、修正後の状態を確認してください：

SELECT 
  r.monitor_id,
  u.email,
  u.name,
  mp.points AS current_points,
  SUM(r.points_earned) AS total_earned_points,
  COUNT(*) AS response_count,
  CASE 
    WHEN mp.points IS NULL THEN '❌ monitor_profilesレコードが存在しません'
    WHEN mp.points != SUM(r.points_earned) THEN '⚠️ ポイントが一致しません'
    ELSE '✅ 正常'
  END AS "状態"
FROM responses r
LEFT JOIN users u ON r.monitor_id = u.id
LEFT JOIN monitor_profiles mp ON r.monitor_id = mp.user_id
WHERE r.points_earned IS NOT NULL
GROUP BY r.monitor_id, u.email, u.name, mp.points
ORDER BY r.monitor_id;


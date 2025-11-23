-- ============================================
-- monitor_profilesテーブルのカラム確認
-- ============================================
-- monitor_profilesテーブルにpointsカラムが存在するか確認します
-- ============================================

-- 1. monitor_profilesテーブルの全カラム一覧
SELECT
    column_name AS "カラム名",
    data_type AS "データ型",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト値",
    CASE 
        WHEN column_name = 'points' THEN '✅ pointsカラムが存在します'
        ELSE '-'
    END AS "状態"
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'monitor_profiles'
ORDER BY
    ordinal_position;

-- 2. pointsカラムの詳細情報
SELECT
    column_name AS "カラム名",
    data_type AS "データ型",
    character_maximum_length AS "最大長",
    numeric_precision AS "精度",
    numeric_scale AS "スケール",
    is_nullable AS "NULL許可",
    column_default AS "デフォルト値",
    CASE 
        WHEN column_name = 'points' THEN '✅ pointsカラムが存在します'
        ELSE '-'
    END AS "状態"
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'monitor_profiles'
    AND column_name = 'points';

-- 3. monitor_profilesテーブルの制約（CHECK制約など）
SELECT
    conname AS "制約名",
    contype AS "制約タイプ",
    pg_get_constraintdef(oid) AS "制約定義"
FROM
    pg_constraint
WHERE
    conrelid = 'public.monitor_profiles'::regclass
    AND contype = 'c';  -- CHECK制約のみ

-- 4. サンプルデータの確認（pointsカラムの値）
-- まず、実際のカラム名を確認してから実行
-- 以下のクエリは、カラムが存在する場合のみ実行してください
SELECT
    *
FROM
    monitor_profiles
LIMIT 5;


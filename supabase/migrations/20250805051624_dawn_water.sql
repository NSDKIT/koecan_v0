/*
  # 学部・学科フィールドの追加

  1. テーブル変更
    - `monitor_profiles`テーブルに`faculty`（学部）と`department`（学科）カラムを追加
  
  2. 変更内容
    - `faculty` (text) - 学部名
    - `department` (text) - 学科名
    - どちらもオプション項目として設定
*/

-- monitor_profilesテーブルに学部・学科フィールドを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monitor_profiles' AND column_name = 'faculty'
  ) THEN
    ALTER TABLE monitor_profiles ADD COLUMN faculty text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monitor_profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE monitor_profiles ADD COLUMN department text;
  END IF;
END $$;
-- user_line_linksテーブルの修正
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. user_idにUNIQUE制約があるか確認
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE
    tc.table_schema = 'public'
    AND tc.table_name = 'user_line_links'
    AND kcu.column_name = 'user_id';

-- 2. user_idにUNIQUE制約を追加（存在しない場合）
-- 注意: 既にUNIQUE制約がある場合はエラーになりますが、問題ありません
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'user_line_links'::regclass
        AND conname LIKE '%user_id%'
        AND contype = 'u'
    ) THEN
        ALTER TABLE user_line_links
        ADD CONSTRAINT user_line_links_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- 3. line_user_idにUNIQUE制約があるか確認
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE
    tc.table_schema = 'public'
    AND tc.table_name = 'user_line_links'
    AND kcu.column_name = 'line_user_id';

-- 4. line_user_idにUNIQUE制約を追加（存在しない場合）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'user_line_links'::regclass
        AND conname LIKE '%line_user_id%'
        AND contype = 'u'
    ) THEN
        ALTER TABLE user_line_links
        ADD CONSTRAINT user_line_links_line_user_id_unique UNIQUE (line_user_id);
    END IF;
END $$;

-- 5. RLSポリシーの確認と再作成
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can insert own line links" ON user_line_links;
DROP POLICY IF EXISTS "Users can update own line links" ON user_line_links;
DROP POLICY IF EXISTS "Service role can manage all line links" ON user_line_links;

-- SELECTポリシー: ユーザーは自分のLINE連携情報を閲覧可能
CREATE POLICY "Users can view own line links"
  ON user_line_links
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERTポリシー: ユーザーは自分のLINE連携情報を挿入可能
CREATE POLICY "Users can insert own line links"
  ON user_line_links
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATEポリシー: ユーザーは自分のLINE連携情報を更新可能
CREATE POLICY "Users can update own line links"
  ON user_line_links
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- サービスロールは全操作可能（APIルートから使用）
CREATE POLICY "Service role can manage all line links"
  ON user_line_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


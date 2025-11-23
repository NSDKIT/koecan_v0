-- ============================================
-- パーソナリティ診断テーブルの作成
-- ============================================
-- モニター学生のパーソナリティ診断結果を保存するテーブル
-- ============================================

-- テーブルの作成
CREATE TABLE IF NOT EXISTS monitor_personality_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('market_engagement', 'growth_strategy', 'organization_style', 'decision_making')),
  question_key text NOT NULL,  -- 'q1', 'q2', 'q3', 'q4', 'q5'
  answer integer NOT NULL CHECK (answer >= 1 AND answer <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, question_key)  -- 1ユーザー1カテゴリー1質問につき1回答
);

-- updated_atトリガーの追加
CREATE TRIGGER update_monitor_personality_responses_updated_at 
  BEFORE UPDATE ON monitor_personality_responses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシーの設定
ALTER TABLE monitor_personality_responses ENABLE ROW LEVEL SECURITY;

-- モニターは自分の回答を閲覧・作成・更新可能
CREATE POLICY "Monitors can view own personality responses" 
  ON monitor_personality_responses 
  FOR SELECT 
  TO authenticated 
  USING (user_id = uid());

CREATE POLICY "Monitors can create own personality responses" 
  ON monitor_personality_responses 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = uid());

CREATE POLICY "Monitors can update own personality responses" 
  ON monitor_personality_responses 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = uid()) 
  WITH CHECK (user_id = uid());

-- サポートスタッフは全ユーザーの回答を閲覧可能
CREATE POLICY "Support staff can view all personality responses" 
  ON monitor_personality_responses 
  FOR SELECT 
  TO authenticated 
  USING (is_support_staff());

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_monitor_personality_responses_user_id 
  ON monitor_personality_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_monitor_personality_responses_category 
  ON monitor_personality_responses(category);

-- ============================================
-- 確認クエリ
-- ============================================
-- 以下のクエリで、テーブルが正しく作成されたか確認してください：

-- SELECT 
--   table_name,
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name = 'monitor_personality_responses'
-- ORDER BY ordinal_position;


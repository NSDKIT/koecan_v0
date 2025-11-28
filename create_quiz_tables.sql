-- ============================================
-- クイズ機能のテーブル作成
-- ============================================
-- アンケート機能と同様の構造でクイズ機能を実装
-- ============================================

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'rejected')),
  points_reward integer DEFAULT 10 CHECK (points_reward > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'rating', 'yes_no', 'ranking')),
  options text[] DEFAULT '{}',
  required boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  is_multiple_select boolean DEFAULT false,
  max_selections integer DEFAULT NULL,
  correct_answer text DEFAULT NULL -- クイズ用：正解を保存
);

-- 既存環境で古いチェック制約が残っている場合に備えて更新
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quiz_questions_question_type_check'
      AND table_name = 'quiz_questions'
  ) THEN
    ALTER TABLE quiz_questions
      DROP CONSTRAINT quiz_questions_question_type_check;
  END IF;

  ALTER TABLE quiz_questions
    ADD CONSTRAINT quiz_questions_question_type_check
    CHECK (question_type IN ('text', 'multiple_choice', 'rating', 'yes_no', 'ranking'));
END $$;

-- Quiz responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  monitor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '[]' NOT NULL,
  completed_at timestamptz DEFAULT now(),
  points_earned integer DEFAULT 0,
  score integer DEFAULT NULL, -- クイズ用：正答率やスコア（0-100）
  UNIQUE(quiz_id, monitor_id) -- 1ユーザー1クイズにつき1回答（再チャレンジ時は更新）
);

-- Point transactions table に quiz_id カラムを追加（既存の場合はスキップ）
-- 注意: 既存のpoint_transactionsテーブルにquiz_idカラムがない場合は追加が必要
-- ただし、既存の構造を壊さないように、別のアプローチを取ることも検討

-- updated_at トリガー
CREATE TRIGGER update_quizzes_updated_at 
  BEFORE UPDATE ON quizzes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================

-- Quizzes table policies
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- クライアントは自分のクイズを管理可能
CREATE POLICY "Clients can manage own quizzes" 
  ON quizzes 
  FOR ALL 
  TO authenticated 
  USING (
    client_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- モニター学生はアクティブなクイズを閲覧可能
CREATE POLICY "Monitors can view active quizzes" 
  ON quizzes 
  FOR SELECT 
  TO authenticated 
  USING (
    status = 'active' OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'support', 'client'))
  );

-- Quiz questions table policies
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- クライアントと管理者はクイズの質問を管理可能
CREATE POLICY "Clients and admins can manage quiz questions" 
  ON quiz_questions 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q 
      WHERE q.id = quiz_questions.quiz_id 
      AND (q.client_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'support')))
    )
  );

-- モニター学生はアクティブなクイズの質問を閲覧可能
CREATE POLICY "Monitors can view active quiz questions" 
  ON quiz_questions 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q 
      WHERE q.id = quiz_questions.quiz_id 
      AND q.status = 'active'
    ) OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'support', 'client'))
  );

-- Quiz responses table policies
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- モニター学生は自分の回答を作成・閲覧可能
CREATE POLICY "Monitors can create own quiz responses" 
  ON quiz_responses 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (monitor_id = auth.uid());

CREATE POLICY "Monitors can view own quiz responses" 
  ON quiz_responses 
  FOR SELECT 
  TO authenticated 
  USING (monitor_id = auth.uid());

-- クライアントと管理者は全回答を閲覧可能
CREATE POLICY "Clients and admins can view all quiz responses" 
  ON quiz_responses 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = uid() AND role IN ('admin', 'support', 'client'))
  );

-- ============================================
-- Point Management Functions and Triggers
-- ============================================

-- クイズ回答時にポイントを設定する関数（全問正解の場合のみポイント付与）
CREATE OR REPLACE FUNCTION set_quiz_response_points()
RETURNS TRIGGER AS $$
BEGIN
  -- 全問正解（score = 100）の場合のみポイントを付与
  IF NEW.score = 100 THEN
    NEW.points_earned := (SELECT points_reward FROM quizzes WHERE id = NEW.quiz_id);
  ELSE
    NEW.points_earned := 0; -- 全問正解でない場合は0ポイント
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- クイズ回答時にモニターのポイントを更新する関数（全問正解の場合のみ）
CREATE OR REPLACE FUNCTION update_monitor_points_from_quiz()
RETURNS TRIGGER AS $$
DECLARE
  affected_rows integer;
BEGIN
  -- 全問正解（points_earned > 0）の場合のみポイントを更新
  IF NEW.points_earned > 0 THEN
    -- Update monitor points
    UPDATE monitor_profiles 
    SET points = points + NEW.points_earned 
    WHERE user_id = NEW.monitor_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
      RAISE WARNING 'monitor_profilesレコードが見つかりませんでした。user_id: %, quiz_id: %', NEW.monitor_id, NEW.quiz_id;
    END IF;
    
    -- Create point transaction record (survey_idの代わりにquiz_idを使用)
    -- 注意: point_transactionsテーブルにquiz_idカラムがない場合は、別の方法を検討
    -- ここでは、survey_idをNULLにして、notesにquiz_idを記録する方法も考えられる
    -- または、point_transactionsテーブルにquiz_idカラムを追加する
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
DROP TRIGGER IF EXISTS set_quiz_response_points_trigger ON quiz_responses;
CREATE TRIGGER set_quiz_response_points_trigger 
  BEFORE INSERT ON quiz_responses 
  FOR EACH ROW 
  EXECUTE FUNCTION set_quiz_response_points();

DROP TRIGGER IF EXISTS update_monitor_points_from_quiz_trigger ON quiz_responses;
CREATE TRIGGER update_monitor_points_from_quiz_trigger 
  AFTER INSERT ON quiz_responses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_monitor_points_from_quiz();

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quizzes_client_id ON quizzes(client_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_monitor_id ON quiz_responses(monitor_id);


-- ============================================
-- 企業の各従業員のパーソナリティ診断回答を保存するテーブル
-- ============================================
-- CSVインポート時に、各従業員（各行）の個別回答を保存するテーブル
-- ============================================

CREATE TABLE IF NOT EXISTS company_personality_individual_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  timestamp TEXT,
  job_type TEXT,
  years_of_service TEXT,
  market_engagement_q1 INTEGER,
  market_engagement_q2 INTEGER,
  market_engagement_q3 INTEGER,
  growth_strategy_q1 INTEGER,
  growth_strategy_q2 INTEGER,
  growth_strategy_q3 INTEGER,
  growth_strategy_q4 INTEGER,
  organization_style_q1 INTEGER,
  organization_style_q2 INTEGER,
  organization_style_q3 INTEGER,
  decision_making_q1 INTEGER,
  decision_making_q2 INTEGER,
  decision_making_q3 INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_company_personality_individual_responses_company_id ON company_personality_individual_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_company_personality_individual_responses_job_type ON company_personality_individual_responses(company_id, job_type);
CREATE INDEX IF NOT EXISTS idx_company_personality_individual_responses_years ON company_personality_individual_responses(company_id, years_of_service);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_company_personality_individual_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_personality_individual_responses_updated_at
  BEFORE UPDATE ON company_personality_individual_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_company_personality_individual_responses_updated_at();

-- RLSポリシーを設定
ALTER TABLE company_personality_individual_responses ENABLE ROW LEVEL SECURITY;

-- 全員がSELECT可能（学生も見れるように）
CREATE POLICY "Anyone can view company personality individual responses"
  ON company_personality_individual_responses
  FOR SELECT
  USING (true);

-- 管理者のみINSERT/UPDATE/DELETE可能
CREATE POLICY "Admins can insert company personality individual responses"
  ON company_personality_individual_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update company personality individual responses"
  ON company_personality_individual_responses
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete company personality individual responses"
  ON company_personality_individual_responses
  FOR DELETE
  TO authenticated
  USING (is_admin());


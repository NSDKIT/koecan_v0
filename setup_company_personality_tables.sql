-- ============================================
-- 企業パーソナリティ診断機能のセットアップSQL
-- 実行順序: このファイルをSupabaseのSQL Editorで実行してください
-- ============================================

-- 1. advertisementsテーブルにpersonality_typeカラムを追加
ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS personality_type TEXT;

-- コメントを追加
COMMENT ON COLUMN advertisements.personality_type IS '企業のパーソナリティタイプ（例: ENPF, ISRO等）';

-- 2. 企業の職種別・年代別パーソナリティ診断結果を保存するテーブルを作成
CREATE TABLE IF NOT EXISTS company_personality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  category_type TEXT NOT NULL CHECK (category_type IN ('job_type', 'years_of_service')),
  category_value TEXT NOT NULL, -- 職種名または勤続年数
  market_engagement_score NUMERIC NOT NULL,
  growth_strategy_score NUMERIC NOT NULL,
  organization_style_score NUMERIC NOT NULL,
  decision_making_score NUMERIC NOT NULL,
  personality_type TEXT NOT NULL, -- 算出されたタイプコード（例: ENPF）
  response_count INTEGER NOT NULL, -- 回答数
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, category_type, category_value)
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_company_personality_results_company_id ON company_personality_results(company_id);
CREATE INDEX IF NOT EXISTS idx_company_personality_results_category ON company_personality_results(company_id, category_type);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_company_personality_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_personality_results_updated_at
  BEFORE UPDATE ON company_personality_results
  FOR EACH ROW
  EXECUTE FUNCTION update_company_personality_results_updated_at();

-- RLSポリシーを設定
ALTER TABLE company_personality_results ENABLE ROW LEVEL SECURITY;

-- 全員がSELECT可能（学生も見れるように）
CREATE POLICY "Anyone can view company personality results"
  ON company_personality_results
  FOR SELECT
  USING (true);

-- INSERTポリシー（管理者のみ）
CREATE POLICY "Admins can insert company personality results"
  ON company_personality_results
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATEポリシー（管理者のみ）
CREATE POLICY "Admins can update company personality results"
  ON company_personality_results
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETEポリシー（管理者のみ）
CREATE POLICY "Admins can delete company personality results"
  ON company_personality_results
  FOR DELETE
  TO authenticated
  USING (is_admin());


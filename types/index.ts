// koecan_v0-main/types/index.ts

export interface User {
  id: string;
  email: string;
  role: 'monitor' | 'client' | 'admin' | 'support';
  name: string;
  created_at: string;
  updated_at: string;
}

export interface MonitorProfile {
  monitor_id: string;
  user_id: string;
  age: number;
  gender?: string | null; // null許容
  occupation?: string | null; // null許容
  location?: string | null; // null許容
  points: number;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string;
  created_at: string;
  updated_at: string;
}

// ClientDashboard.tsxが依存する型
export interface Survey {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'rejected';
  points_reward: number;
  created_at: string;
  updated_at: string;
}

// ClientDashboard.tsxが依存する型
export interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'rating' | 'yes_no' | 'ranking';
  options?: string[];
  required: boolean;
  order_index: number;
  created_at: string;
  is_multiple_select?: boolean;
  max_selections?: number | null; // null許容
}

export interface Answer {
  question_id: string;
  answer: string;
}

export interface Response {
  id: string;
  survey_id: string;
  monitor_id: string;
  answers: any; // ★★★ 修正: jsonb を any に変更 ★★★
  completed_at: string;
  points_earned: number;
}

export interface PointTransaction {
  id: string;
  monitor_id: string;
  survey_id?: string;
  points: number;
  transaction_type: 'earned' | 'redeemed';
  created_at: string;
  notes?: string | null; // POINT TRANSACTION TABLE FIX: notes カラムを追加
}

export interface PointExchangeRequest {
  id: string;
  monitor_id: string;
  exchange_type: 'paypay' | 'amazon' | 'starbucks';
  points_amount: number;
  status: 'pending' | 'completed' | 'rejected';
  contact_info: string;
  notes?: string | null; // null許容
  created_at: string;
  processed_at?: string | null; // null許容
  
  // POINT EXCHANGE TABLE FIX: 新規カラムを追加
  contact_type?: 'email' | 'line_push' | null; // null許容
  exchange_contact?: string | null; // null許容
  reward_detail?: string | null; // null許容 (管理者が入力するギフト券URL/コード)
  // END FIX
}

// 企業情報 (Advertisement)
export interface Advertisement {
  id: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  target_regions?: string[] | null;
  priority: number;

  // ★★★ 新しいフィールドリストに完全に置き換え ★★★
  company_name: string; // 会社名 (必須)
  official_website_url?: string | null; // 公式ホームページのURL
  representative_name?: string | null; // 代表者名
  company_vision?: string | null; // 貴社が目指す未来（100文字程度）
  headquarters_location?: string | null; // 所在地（本社）
  branch_office_location?: string | null; // 所在地（支社）
  industries?: string[] | null; // 業界（複数回答）
  establishment_year?: number | null; // 設立年
  employee_count?: number | null; // 従業員数
  employee_gender_ratio?: string | null; // 男女比
  employee_avg_age?: number | null; // 従業員の平均年齢（社員以外を含む）

  highlight_point_1?: string | null; // イチオシポイント①
  highlight_point_2?: string | null; // イチオシポイント②
  highlight_point_3?: string | null; // イチオシポイント③

  starting_salary?: string | null; // 初任給
  avg_annual_income_20s?: string | null; // 20代の平均年収
  avg_annual_income_30s?: string | null; // 30代の平均年収
  three_year_retention_rate?: string | null; // ３年間の定着率
  promotion_model_case?: string | null; // 昇進・キャリアパスのモデルケース

  side_job_allowed?: boolean; // 副業の可否
  remote_work_available?: boolean; // リモートワークの有無
  housing_allowance_available?: boolean; // 住宅手当・家賃補助の有無
  female_parental_leave_rate?: string | null; // 女性の育休・産休の取得割合
  male_parental_leave_rate?: string | null; // 男性の育休取得割合
  health_management_practices?: string[] | null; // 実践している健康経営の取り組み（複数選択）
  internal_event_frequency?: string | null; // 社内イベントの頻度

  must_tell_welfare?: string | null; // これだけは伝えたい福利厚生
  transfer_existence?: boolean; // 異動や転勤の有無
  transfer_frequency?: string | null; // 異動や転勤の頻度
  
  recruitment_roles_count?: string | null; // 募集職種とその人数
  selection_flow_steps?: string[] | null; // 選考フロー（複数回答）

  // ★★★ 新規追加フィールド ★★★
  required_qualifications?: string | null; // 必須資格・免許
  working_hours?: string | null; // 勤務時間
  holidays?: string | null; // 休日
  annual_holidays?: string | null; // 年間休日数
  official_line_url?: string | null; // 公式LINE

  // 問い合わせ・採用情報
  recruitment_contact?: string | null; // 採用に関する問い合わせ先
  recruitment_department?: string | null; // 採用担当部署（担当者）
  recruitment_info_page_url?: string | null; // 採用情報ページ
  instagram_url?: string | null; // Instagram
  tiktok_url?: string | null; // TikTok
  other_sns_sites?: string | null; // その他掲載サイトやSNSがあればご入力ください。

  // インターンシップ情報
  internship_scheduled?: boolean; // インターンシップ実施予定
  internship_schedule?: string | null; // インターンシップ実施日程
  internship_capacity?: string | null; // 定員（目安でも可）
  internship_target_students?: string[] | null; // 対象学生（複数回答）
  internship_locations?: string[] | null; // 実施場所（複数回答）
  internship_content_types?: string[] | null; // インターンシップの内容（複数選択）
  internship_paid_unpaid?: '有償' | '無償' | null; // 有償 or 無償
  transport_lodging_stipend?: boolean; // 交通費・宿泊費の支給
  internship_application_url?: string | null; // インターンシップ申込URL
  
  // 旧フィールド（互換性のため残す。利用しない場合はnullとなる。）
  title?: string | null; 
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  location_info?: string | null;
  employee_gender_ratio_old?: string | null; // 旧の男女比
  employee_age_composition_old?: string | null; // 旧の年齢構成比
  recommended_points?: string[] | null; // 旧のおすすめポイント
  salary_info?: string | null; // 旧の給与情報
  paid_leave_rate?: string | null; // 旧の有給取得率
  long_holidays?: string | null; // 旧の長期休暇
  training_support?: string | null; // 旧の研修支援
  busy_season_intensity?: string | null; // 旧の繁忙期
  youtube_short_url?: string | null; // 旧のYouTube URL
  recruitment_roles?: string | null; // 旧の募集職種
  application_qualifications?: string | null; // 旧の応募資格
  selection_flow?: string | null; // 旧の選考フロー
  internship_info?: string | null; // 旧のインターン情報
}

export interface ChatRoom {
  id: string;
  name?: string | null; // null許容
  room_type: 'direct' | 'group' | 'support';
  participants: string[];
  created_by?: string | null; // null許容
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  created_at: string;
}

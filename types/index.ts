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
  gender?: string;
  occupation?: string;
  location?: string;
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
  max_selections?: number;
}

export interface Answer {
  question_id: string;
  answer: string;
}

export interface Response {
  id: string;
  survey_id: string;
  monitor_id: string;
  answers: Answer[];
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
}

export interface PointExchangeRequest {
  id: string;
  monitor_id: string;
  exchange_type: 'paypay' | 'amazon' | 'starbucks';
  points_amount: number;
  status: 'pending' | 'completed' | 'rejected';
  contact_info: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string; // YouTubeショートなどへのリンクに使用
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  target_regions?: string[];
  priority: number;

  // 新しい就職情報関連のフィールドを追加
  company_name?: string;
  location_info?: string; // 所在地（本社／支社）
  establishment_year?: number; // 設立年
  employee_count?: number; // 従業員数
  employee_gender_ratio?: string; // 男女比
  employee_age_composition?: string; // 年齢構成比
  
  recommended_points?: string[]; // おすすめポイント３つ
  
  salary_info?: string; // 給与・昇給・賞与：モデル年収例など
  paid_leave_rate?: string; // 有給取得率
  long_holidays?: string; // 長期休暇
  training_support?: string; // 研修・成長支援
  busy_season_intensity?: string; // 繁忙期の忙しさ
  
  youtube_short_url?: string; // 会社の雰囲気・文化 (YouTubeショートに飛ばすための専用URL)
  
  recruitment_roles?: string; // 募集職種と人数
  application_qualifications?: string; // 応募資格
  selection_flow?: string; // 選考フロー
}

export interface ChatRoom {
  id: string;
  name?: string;
  room_type: 'direct' | 'group' | 'support';
  participants: string[];
  created_by?: string;
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

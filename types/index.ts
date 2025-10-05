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
  answers: jsonb;
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
  notes?: string | null; // ★★★ POINT TRANSACTION TABLE FIX: notes カラムを追加 ★★★
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
  
  // ★★★ POINT EXCHANGE TABLE FIX: 新規カラムを追加 ★★★
  contact_type?: 'email' | 'line_push' | null; // null許容
  exchange_contact?: string | null; // null許容
  reward_detail?: string | null; // null許容 (管理者が入力するギフト券URL/コード)
  // ★★★ END FIX ★★★
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url?: string | null; 
  link_url?: string | null; 
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  target_regions?: string[] | null;
  priority: number;

  // 新しい就職情報関連のフィールド (全て null を許容)
  company_name?: string | null;
  location_info?: string | null; 
  establishment_year?: number | null; 
  employee_count?: number | null; 
  employee_gender_ratio?: string | null; 
  employee_age_composition?: string | null; 
  
  recommended_points?: string[] | null; 
  
  salary_info?: string | null; 
  paid_leave_rate?: string | null; 
  long_holidays?: string | null; 
  training_support?: string | null; 
  busy_season_intensity?: string | null; 
  
  youtube_short_url?: string | null; 
  
  recruitment_roles?: string | null; 
  application_qualifications?: string | null; 
  selection_flow?: string | null; 
  internship_info?: string | null;
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

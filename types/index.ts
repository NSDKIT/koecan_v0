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
  link_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  target_regions?: string[];
  priority: number;
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
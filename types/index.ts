// koecan_v0-main/types/index.ts

export interface User {
// ... (User, MonitorProfile, ClientProfile は省略)

// ...
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url?: string | null; // ★修正: null を追加
  link_url?: string | null;   // ★修正: null を追加
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  target_regions?: string[];
  priority: number;

  // 新しい就職情報関連のフィールドを追加 (すべて null を許容するように修正)
  company_name?: string | null; // ★修正: null を追加 (ただしフォームでは必須扱いのまま)
  location_info?: string | null; // ★修正: null を追加
  establishment_year?: number | null; // ★修正: null を追加
  employee_count?: number | null; // ★修正: null を追加
  employee_gender_ratio?: string | null; // ★修正: null を追加
  employee_age_composition?: string | null; // ★修正: null を追加
  
  recommended_points?: string[] | null; // ★修正: null を追加
  
  salary_info?: string | null; // ★修正: null を追加
  paid_leave_rate?: string | null; // ★修正: null を追加
  long_holidays?: string | null; // ★修正: null を追加
  training_support?: string | null; // ★修正: null を追加
  busy_season_intensity?: string | null; // ★修正: null を追加
  
  youtube_short_url?: string | null; // ★修正: null を追加
  
  recruitment_roles?: string | null; // ★修正: null を追加
  application_qualifications?: string | null; // ★修正: null を追加
  selection_flow?: string | null; // ★修正: null を追加
  internship_info?: string | null; // もしあれば追加
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

/*
  # ポイント交換リクエストテーブルの作成

  1. New Tables
    - `point_exchange_requests`
      - `id` (uuid, primary key)
      - `monitor_id` (uuid, foreign key to users)
      - `exchange_type` (text, PayPay/Amazon/Starbucks)
      - `points_amount` (integer, 交換ポイント数)
      - `status` (text, pending/completed/rejected)
      - `contact_info` (text, 連絡先情報)
      - `notes` (text, 備考)
      - `created_at` (timestamp)
      - `processed_at` (timestamp)

  2. Security
    - Enable RLS on `point_exchange_requests` table
    - Add policies for monitors to create and view their own requests
    - Add policies for admins to view and manage all requests
*/

CREATE TABLE IF NOT EXISTS point_exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exchange_type text NOT NULL CHECK (exchange_type IN ('paypay', 'amazon', 'starbucks')),
  points_amount integer NOT NULL CHECK (points_amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  contact_info text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_point_exchange_requests_monitor_id ON point_exchange_requests(monitor_id);
CREATE INDEX IF NOT EXISTS idx_point_exchange_requests_status ON point_exchange_requests(status);
CREATE INDEX IF NOT EXISTS idx_point_exchange_requests_created_at ON point_exchange_requests(created_at);

-- Enable Row Level Security
ALTER TABLE point_exchange_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Monitors can create exchange requests" ON point_exchange_requests 
  FOR INSERT TO authenticated 
  WITH CHECK (monitor_id = uid());

CREATE POLICY "Monitors can view own exchange requests" ON point_exchange_requests 
  FOR SELECT TO authenticated 
  USING (monitor_id = uid());

CREATE POLICY "Admins can view all exchange requests" ON point_exchange_requests 
  FOR SELECT TO authenticated 
  USING (is_admin());

CREATE POLICY "Admins can update exchange requests" ON point_exchange_requests 
  FOR UPDATE TO authenticated 
  USING (is_admin());
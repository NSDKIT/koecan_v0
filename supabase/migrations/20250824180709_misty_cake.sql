/*
  # Add Support Staff Role and Account

  1. Database Changes
    - Update users table role constraint to include 'support'
    - Create support staff account
    - Update RLS policies for support staff access

  2. Security
    - Support staff can view and respond to support chat rooms
    - Support staff can view user profiles for consultation context
*/

-- Update the role constraint to include 'support'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('monitor', 'client', 'admin', 'support'));

-- Create support staff account
INSERT INTO users (id, email, role, name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'support@example.com',
  'support',
  'キャリアサポートスタッフ',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create function to check if current user is support staff
CREATE OR REPLACE FUNCTION is_support_staff() RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'support' OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'support');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for support staff

-- Support staff can view all chat rooms (especially support rooms)
CREATE POLICY "Support staff can view all chat rooms" ON chat_rooms 
FOR SELECT TO authenticated 
USING (is_support_staff());

-- Support staff can send messages to any room
CREATE POLICY "Support staff can send messages to any room" ON chat_messages 
FOR INSERT TO authenticated 
WITH CHECK (is_support_staff());

-- Support staff can view all messages
CREATE POLICY "Support staff can view all messages" ON chat_messages 
FOR SELECT TO authenticated 
USING (is_support_staff());

-- Support staff can view user profiles for consultation context
CREATE POLICY "Support staff can view user profiles" ON users 
FOR SELECT TO authenticated 
USING (is_support_staff());

-- Support staff can view monitor profiles for consultation context
CREATE POLICY "Support staff can view monitor profiles" ON monitor_profiles 
FOR SELECT TO authenticated 
USING (is_support_staff());

-- Support staff can view client profiles for consultation context
CREATE POLICY "Support staff can view client profiles" ON client_profiles 
FOR SELECT TO authenticated 
USING (is_support_staff());

-- Create index for support staff queries
CREATE INDEX IF NOT EXISTS idx_users_role_support ON users(role) WHERE role = 'support';
CREATE INDEX IF NOT EXISTS idx_chat_rooms_support ON chat_rooms(room_type) WHERE room_type = 'support';
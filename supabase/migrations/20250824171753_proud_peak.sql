/*
  # チャット機能のテーブル作成

  1. New Tables
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `name` (text, optional)
      - `room_type` (text, direct/group/support)
      - `participants` (uuid array)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `chat_messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to chat_rooms)
      - `sender_id` (uuid, foreign key to users)
      - `message` (text)
      - `message_type` (text, text/image/file)
      - `is_read` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to access their own rooms and messages
    - Add indexes for performance

  3. Changes
    - Create chat functionality tables
    - Set up proper relationships and constraints
*/

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  room_type text NOT NULL CHECK (room_type IN ('direct', 'group', 'support')),
  participants uuid[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms table
CREATE POLICY "Users can view rooms they participate in" ON chat_rooms FOR SELECT TO authenticated USING (
  auth.uid() = ANY(participants) OR created_by = auth.uid()
);

CREATE POLICY "Users can create chat rooms" ON chat_rooms FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND auth.uid() = ANY(participants)
);

CREATE POLICY "Room creators can update rooms" ON chat_rooms FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view messages in their rooms" ON chat_messages FOR SELECT TO authenticated USING (
  room_id IN (SELECT id FROM chat_rooms WHERE auth.uid() = ANY(participants))
);

CREATE POLICY "Users can send messages to their rooms" ON chat_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND room_id IN (SELECT id FROM chat_rooms WHERE auth.uid() = ANY(participants))
);

-- Create triggers for updated_at
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a default support room for all users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM chat_rooms WHERE room_type = 'support' AND name = 'サポート') THEN
    INSERT INTO chat_rooms (name, room_type, participants, created_by)
    VALUES ('サポート', 'support', '{}', NULL);
  END IF;
END $$;
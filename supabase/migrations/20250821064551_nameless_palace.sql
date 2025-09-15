/*
  # Advertisement System

  1. New Tables
    - `advertisements`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `link_url` (text)
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, foreign key to users)

  2. Security
    - Enable RLS on `advertisements` table
    - Add policies for admin management and monitor viewing
*/

CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_display_order ON advertisements(display_order);
CREATE INDEX IF NOT EXISTS idx_advertisements_created_by ON advertisements(created_by);

-- Enable Row Level Security
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertisements table
CREATE POLICY "Admins can manage all advertisements" ON advertisements FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Active advertisements are viewable by monitors" ON advertisements FOR SELECT TO authenticated USING (
  is_active = true AND EXISTS (SELECT 1 FROM users WHERE id = uid() AND role = 'monitor')
);
CREATE POLICY "Active advertisements are viewable by everyone" ON advertisements FOR SELECT TO authenticated USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
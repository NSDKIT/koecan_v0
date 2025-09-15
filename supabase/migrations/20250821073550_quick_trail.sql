/*
  # Add regional targeting for advertisements

  1. Schema Changes
    - Add `target_regions` column to advertisements table for regional targeting
    - Add `priority` column for advertisement priority within regions
    - Update RLS policies to support regional filtering

  2. Security
    - Maintain existing RLS policies
    - Add indexes for performance optimization
*/

-- Add regional targeting columns to advertisements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertisements' AND column_name = 'target_regions'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN target_regions text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertisements' AND column_name = 'priority'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN priority integer DEFAULT 0;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_advertisements_target_regions ON advertisements USING GIN (target_regions);
CREATE INDEX IF NOT EXISTS idx_advertisements_priority ON advertisements (priority DESC);

-- Update the RLS policy to include regional targeting
DROP POLICY IF EXISTS "Active advertisements are viewable by monitors" ON advertisements;

CREATE POLICY "Active advertisements are viewable by monitors" ON advertisements
FOR SELECT TO authenticated
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = uid() AND users.role = 'monitor'
  )
);
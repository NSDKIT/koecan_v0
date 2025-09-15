/*
  # Add is_multiple_select column to questions table

  1. Changes
    - Add `is_multiple_select` column to `questions` table
    - Set default value to `false` for existing records
    - Column allows null values for backward compatibility

  2. Purpose
    - Enable differentiation between single-choice and multiple-choice questions
    - Support checkbox-style questions in addition to radio button questions
*/

-- Add is_multiple_select column to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'is_multiple_select'
  ) THEN
    ALTER TABLE questions ADD COLUMN is_multiple_select boolean DEFAULT false;
  END IF;
END $$;
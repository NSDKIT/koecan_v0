/*
  # Add ranking question type support

  1. Schema Changes
    - Update questions table check constraint to include 'ranking' type
    - Add max_selections column to support ranking limitations

  2. Security
    - No RLS policy changes needed (existing policies cover new question type)
*/

-- Add max_selections column to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'max_selections'
  ) THEN
    ALTER TABLE questions ADD COLUMN max_selections integer DEFAULT NULL;
  END IF;
END $$;

-- Update the check constraint to include 'ranking' question type
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_question_type_check 
  CHECK (question_type IN ('text', 'multiple_choice', 'rating', 'yes_no', 'ranking'));
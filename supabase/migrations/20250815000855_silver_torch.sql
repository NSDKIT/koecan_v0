/*
  # Add detailed profile fields for monitors

  1. New Columns
    - Add detailed profile fields to monitor_profiles table for job hunting survey
    - Fields include gender, grade, location, school info, career preferences, etc.

  2. Changes
    - Extend monitor_profiles table with comprehensive job hunting related fields
    - Add proper constraints and default values
*/

-- Add new columns to monitor_profiles table
ALTER TABLE monitor_profiles 
ADD COLUMN IF NOT EXISTS gender_detail text,
ADD COLUMN IF NOT EXISTS grade text,
ADD COLUMN IF NOT EXISTS hometown text,
ADD COLUMN IF NOT EXISTS school_name text,
ADD COLUMN IF NOT EXISTS faculty_department text,
ADD COLUMN IF NOT EXISTS interested_industries text[],
ADD COLUMN IF NOT EXISTS interested_job_types text[],
ADD COLUMN IF NOT EXISTS preferred_work_areas text[],
ADD COLUMN IF NOT EXISTS company_selection_criteria_1 text,
ADD COLUMN IF NOT EXISTS company_selection_criteria_2 text,
ADD COLUMN IF NOT EXISTS company_selection_criteria_3 text,
ADD COLUMN IF NOT EXISTS important_benefits_1 text,
ADD COLUMN IF NOT EXISTS important_benefits_2 text,
ADD COLUMN IF NOT EXISTS important_benefits_3 text,
ADD COLUMN IF NOT EXISTS dealbreaker_points_1 text,
ADD COLUMN IF NOT EXISTS dealbreaker_points_2 text,
ADD COLUMN IF NOT EXISTS dealbreaker_points_3 text,
ADD COLUMN IF NOT EXISTS fulfilling_work_state text,
ADD COLUMN IF NOT EXISTS job_hunting_start_time text,
ADD COLUMN IF NOT EXISTS desired_company_info text,
ADD COLUMN IF NOT EXISTS work_satisfaction_moments text,
ADD COLUMN IF NOT EXISTS info_sources text,
ADD COLUMN IF NOT EXISTS helpful_info_sources_1 text,
ADD COLUMN IF NOT EXISTS helpful_info_sources_2 text,
ADD COLUMN IF NOT EXISTS helpful_info_sources_3 text,
ADD COLUMN IF NOT EXISTS sns_company_account_usage text,
ADD COLUMN IF NOT EXISTS memorable_sns_content text,
ADD COLUMN IF NOT EXISTS frequently_used_sns text[],
ADD COLUMN IF NOT EXISTS company_research_focus text,
ADD COLUMN IF NOT EXISTS positive_selection_experience text,
ADD COLUMN IF NOT EXISTS selection_improvement_suggestions text,
ADD COLUMN IF NOT EXISTS memorable_recruitment_content text;
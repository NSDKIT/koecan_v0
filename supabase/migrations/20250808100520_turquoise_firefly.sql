/*
  # Fix Auth Trigger Issues

  1. Database Functions
    - Drop and recreate handle_admin_auth function with proper error handling
    - Ensure the function handles all edge cases gracefully

  2. Security
    - Review and fix RLS policies that might be interfering with auth
    - Ensure auth.users table policies don't conflict with Supabase's internal operations

  3. Triggers
    - Recreate auth trigger with better error handling
*/

-- Drop existing problematic function if it exists
DROP FUNCTION IF EXISTS handle_admin_auth() CASCADE;

-- Recreate the admin auth function with better error handling
CREATE OR REPLACE FUNCTION handle_admin_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is the admin email
  IF NEW.email = 'admin@example.com' THEN
    BEGIN
      -- Try to insert admin user record
      INSERT INTO public.users (id, email, role, name, created_at, updated_at)
      VALUES (
        NEW.id,
        NEW.email,
        'admin',
        '管理者',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        updated_at = NOW();
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Failed to create admin user profile: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_admin_auth();

-- Ensure RLS is properly configured for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies and recreate them properly
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- Recreate policies with proper conditions
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow user creation during signup"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
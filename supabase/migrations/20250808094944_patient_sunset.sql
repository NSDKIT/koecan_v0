/*
  # Create public read policy for client_registration_codes

  1. Security Changes
    - Add public read access policy for client_registration_codes table
    - Allow anyone to read registration codes for verification purposes

  This enables registration code verification without authentication.
*/

-- Create policy to allow public read access to client_registration_codes
CREATE POLICY "Public read access for registration codes"
  ON client_registration_codes
  FOR SELECT
  TO public
  USING (true);
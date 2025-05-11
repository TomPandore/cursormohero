/*
  # Add policy for profile creation during signup

  This migration adds a policy to allow profile creation during the signup process,
  before the user is fully authenticated.

  1. Changes
    - Add new policy to allow profile creation for public users
*/

-- Drop the existing insert policy as it's too restrictive
DROP POLICY IF EXISTS "Enable insert access to own profile" ON profiles;

-- Create a new policy that allows profile creation during signup
CREATE POLICY "Enable profile creation during signup"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Keep the existing policies for authenticated users
CREATE POLICY "Enable insert for authenticated users"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
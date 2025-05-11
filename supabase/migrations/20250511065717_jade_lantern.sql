/*
  # Add insert policy for profiles table

  1. Security Changes
    - Add RLS policy to allow new users to create their profile during signup
    - Policy ensures users can only create their own profile with matching auth.uid()
    - Maintains existing RLS policies for read and update operations

  Note: This policy is essential for the signup flow to work correctly
*/

CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
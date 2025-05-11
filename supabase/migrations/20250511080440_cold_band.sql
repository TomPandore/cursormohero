/*
  # Add profile creation policy

  1. Security Changes
    - Add RLS policy to allow authenticated users to create their own profile
    - Policy ensures users can only create a profile with their own auth.uid()
    
  2. Notes
    - This policy is essential for the signup flow
    - Complements existing policies for SELECT and UPDATE
*/

-- Add policy to allow authenticated users to create their own profile
CREATE POLICY "Allow authenticated users to insert their own profile"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
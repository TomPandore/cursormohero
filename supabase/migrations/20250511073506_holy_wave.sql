/*
  # Fix Profiles Table RLS Policies

  1. Changes
    - Add RLS policy for profile creation
    - Add RLS policy for profile updates
    - Add RLS policy for profile reads
    - Enable RLS on profiles table

  2. Security
    - Ensures users can only create their own profile
    - Ensures users can only update their own profile
    - Ensures users can only read their own profile
    - Maintains data isolation between users
*/

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
EXCEPTION 
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create comprehensive RLS policies
CREATE POLICY "Users can create their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
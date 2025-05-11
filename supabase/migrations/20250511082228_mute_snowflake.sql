/*
  # Fix RLS policies for profiles table
  
  1. Security Changes
    - Drop existing policies to ensure clean slate
    - Enable RLS on profiles table
    - Add policies for:
      - Profile creation (INSERT) for authenticated users
      - Profile reading (SELECT) for authenticated users
      - Profile updating (UPDATE) for authenticated users
    
  2. Policy Details
    - All policies use auth.uid() = id as the security check
    - Policies are restricted to authenticated users only
    - Separate USING and WITH CHECK clauses for UPDATE policy
*/

-- First, drop any existing policies on the profiles table
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access to own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add policy for profile creation
-- This allows new users to create their profile during signup
CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Add policy for reading own profile
CREATE POLICY "Enable read access to own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Add policy for updating own profile
CREATE POLICY "Enable update access to own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
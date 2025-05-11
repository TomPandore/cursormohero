/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies for profiles table that are causing conflicts
    - Add new RLS policies that properly handle profile creation and management
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Profile creation during signup
      - Reading own profile
      - Updating own profile
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
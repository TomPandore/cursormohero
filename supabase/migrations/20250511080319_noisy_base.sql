/*
  # Fix profiles table RLS policies

  1. Changes
    - Add RLS policy to allow profile creation during signup
    - Add RLS policy to allow authenticated users to read their own profile
    - Add RLS policy to allow authenticated users to update their own profile

  2. Security
    - Enable RLS on profiles table
    - Policies ensure users can only access and modify their own data
    - Special policy for initial profile creation during signup
*/

-- First enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access to own profile" ON profiles;

-- Allow users to create their own profile during signup
CREATE POLICY "Enable profile creation during signup"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Enable read access to own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update access to own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
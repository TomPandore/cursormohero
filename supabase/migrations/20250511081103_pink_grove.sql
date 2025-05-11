/*
  # Fix RLS policies for profile creation

  This migration updates the RLS policies to properly handle profile creation during signup.

  1. Changes
    - Drop existing policies to avoid conflicts
    - Add new policies for profile creation and management
    
  2. Security
    - Enables RLS on profiles table
    - Adds policies for:
      - Public profile creation during signup
      - Authenticated user profile management
*/

-- First enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access to own profile" ON profiles;

-- Allow public profile creation during signup
CREATE POLICY "Enable profile creation during signup"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to read their own profile
CREATE POLICY "Enable read access to own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Enable update access to own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
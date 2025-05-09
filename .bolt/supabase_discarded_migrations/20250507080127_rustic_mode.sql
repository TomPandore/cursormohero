/*
  # Create users table with authentication

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, required)
      - `clan` (text, required)
      - `total_days_completed` (integer, default 0)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to:
      - Read their own profile
      - Update their own profile
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  clan text NOT NULL CHECK (clan IN ('onotka', 'ekloa', 'okwaho')),
  total_days_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
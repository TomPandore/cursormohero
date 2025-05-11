/*
  # Initial Schema Setup
  
  1. New Tables
    - `clans` table for storing clan information
    - `profiles` table for user profiles with clan association
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    
  3. Relationships
    - Foreign key constraint between profiles and clans
*/

-- Create clans table
CREATE TABLE IF NOT EXISTS clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_clan text NOT NULL,
  tagline text,
  description text,
  image_url text,
  couleur_theme text,
  rituel_entree text,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  email text UNIQUE,
  clan_id uuid REFERENCES clans(id) ON DELETE SET NULL,
  progress jsonb DEFAULT '{"totalCompletedDays": 0}'::jsonb,
  programme_id uuid,
  jour_actuel integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for clans
CREATE POLICY "Allow public read access to clans"
  ON clans
  FOR SELECT
  TO public
  USING (true);

-- Policies for profiles
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
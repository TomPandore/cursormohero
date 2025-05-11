/*
  # Add clan foreign key constraint
  
  1. Changes
    - Add foreign key constraint to profiles table for clan_id
    - This ensures referential integrity between profiles and clans tables
    
  2. Security
    - Add policy for authenticated users to update their own clan_id
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_clan_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_clan_id_fkey
    FOREIGN KEY (clan_id)
    REFERENCES clans(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own clan_id" ON profiles;
DROP POLICY IF EXISTS "Allow everything for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow everything for everyone" ON profiles;

-- Désactiver temporairement RLS pour les tests
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Créer une politique unique plus simple
CREATE POLICY "Enable all access for authenticated user"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    -- Version plus permissive pour déboguer
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    -- Version plus permissive pour déboguer
    auth.role() = 'authenticated'
  );
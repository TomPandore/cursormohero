-- Create progression_exercice table
CREATE TABLE IF NOT EXISTS progression_exercice (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercice_id UUID REFERENCES exercices(id) ON DELETE CASCADE,
  valeur_realisee INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add RLS policies
ALTER TABLE progression_exercice ENABLE ROW LEVEL SECURITY;

-- Supprimer la politique existante si elle existe
DROP POLICY IF EXISTS "Users can manage their own progression" ON progression_exercice;

-- Créer une politique plus permissive
CREATE POLICY "Enable all access for authenticated users"
  ON progression_exercice
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_progression_exercice_user_id ON progression_exercice(user_id);
CREATE INDEX IF NOT EXISTS idx_progression_exercice_exercice_id ON progression_exercice(exercice_id); 
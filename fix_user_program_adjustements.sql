-- Script pour créer/réparer la table user_program_adjustements et résoudre le problème RLS

-- 1. Créer la table user_program_adjustements si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_program_adjustements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    difficulty_factor DECIMAL(3,2) DEFAULT 1.0 CHECK (difficulty_factor >= 0.6 AND difficulty_factor <= 1.6),
    last_feedback TEXT CHECK (last_feedback IN ('hard', 'ok', 'easy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Contrainte unique sur la combinaison user_id + programme_id
    UNIQUE(user_id, programme_id)
);

-- 2. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_program_adjustements_user_id ON user_program_adjustements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_program_adjustements_programme_id ON user_program_adjustements(programme_id);
CREATE INDEX IF NOT EXISTS idx_user_program_adjustements_composite ON user_program_adjustements(user_id, programme_id);

-- 3. Désactiver RLS temporairement pour nettoyer
ALTER TABLE user_program_adjustements DISABLE ROW LEVEL SECURITY;

-- 4. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON user_program_adjustements;
DROP POLICY IF EXISTS "Users can only access their own adjustments" ON user_program_adjustements;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON user_program_adjustements;

-- 5. Créer une politique RLS simple et permissive pour les utilisateurs authentifiés
CREATE POLICY "Allow full access for authenticated users" ON user_program_adjustements
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. Réactiver RLS
ALTER TABLE user_program_adjustements ENABLE ROW LEVEL SECURITY;

-- 7. Créer une fonction trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_program_adjustements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Créer le trigger
DROP TRIGGER IF EXISTS update_user_program_adjustements_updated_at ON user_program_adjustements;
CREATE TRIGGER update_user_program_adjustements_updated_at
    BEFORE UPDATE ON user_program_adjustements
    FOR EACH ROW
    EXECUTE PROCEDURE update_user_program_adjustements_updated_at();

-- Message de confirmation
SELECT 'Table user_program_adjustements créée/réparée avec succès avec les politiques RLS appropriées.' as status;


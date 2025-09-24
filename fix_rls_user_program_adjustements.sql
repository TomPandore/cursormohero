-- Script pour corriger le problème RLS de la table user_program_adjustements
-- Résout l'erreur: "new row violates row-level security policy"

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_program_adjustements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    difficulty_factor DECIMAL(3,2) DEFAULT 1.0,
    last_feedback TEXT CHECK (last_feedback IN ('hard', 'ok', 'easy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Contrainte unique pour la clé composite (nécessaire pour l'upsert)
    UNIQUE(user_id, programme_id)
);

-- 2. Désactiver RLS temporairement pour nettoyer
ALTER TABLE user_program_adjustements DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON user_program_adjustements;
DROP POLICY IF EXISTS "Users can only access their own adjustments" ON user_program_adjustements;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON user_program_adjustements;

-- 4. Créer une politique RLS permissive pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users full access to their adjustments" ON user_program_adjustements
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Réactiver RLS
ALTER TABLE user_program_adjustements ENABLE ROW LEVEL SECURITY;

-- 6. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_program_adjustements_user_programme ON user_program_adjustements(user_id, programme_id);

-- Message de confirmation
SELECT 'Table user_program_adjustements corrigée avec politiques RLS appropriées' as status;


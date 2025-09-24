-- Script pour retirer uniquement les politiques RLS de la table user_program_adjustements

-- Désactiver RLS sur la table user_program_adjustements
ALTER TABLE IF EXISTS user_program_adjustements DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes sur user_program_adjustements
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON user_program_adjustements;
DROP POLICY IF EXISTS "Users can only access their own adjustments" ON user_program_adjustements;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON user_program_adjustements;

-- Message de confirmation
SELECT 'Politiques RLS supprimées pour la table user_program_adjustements' as status;


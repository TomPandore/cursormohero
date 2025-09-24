-- Script pour supprimer TOUTES les politiques RLS de toutes les tables
-- À utiliser en cas de problème avec les Row Level Security policies

-- Désactiver RLS sur toutes les tables principales
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS programmes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jours DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progression_exercice DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS completed_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_program_adjustements DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes sur profiles
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own clan_id" ON profiles;
DROP POLICY IF EXISTS "Allow everything for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow everything for everyone" ON profiles;

-- Supprimer toutes les politiques existantes sur clans
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON clans;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON clans;

-- Supprimer toutes les politiques existantes sur programmes
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON programmes;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON programmes;

-- Supprimer toutes les politiques existantes sur jours
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON jours;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON jours;

-- Supprimer toutes les politiques existantes sur exercices
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON exercices;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON exercices;

-- Supprimer toutes les politiques existantes sur quotes
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON quotes;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON quotes;

-- Supprimer toutes les politiques existantes sur blog
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON blog;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON blog;

-- Supprimer toutes les politiques existantes sur progression_exercice
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON progression_exercice;
DROP POLICY IF EXISTS "Users can manage their own progression" ON progression_exercice;
DROP POLICY IF EXISTS "Users can only access their own exercise progress" ON progression_exercice;

-- Supprimer toutes les politiques existantes sur completed_days
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON completed_days;
DROP POLICY IF EXISTS "Users can only access their own completed days" ON completed_days;

-- Supprimer toutes les politiques existantes sur user_program_adjustements (si elles existent)
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON user_program_adjustements;
DROP POLICY IF EXISTS "Users can only access their own adjustments" ON user_program_adjustements;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON user_program_adjustements;

-- Message de confirmation
SELECT 'Toutes les politiques RLS ont été supprimées. Les tables sont maintenant en mode permissif.' as status;


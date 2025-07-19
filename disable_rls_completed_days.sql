-- Script pour désactiver temporairement les politiques RLS sur completed_days
-- À exécuter dans l'interface SQL de Supabase

-- 1. Désactiver le RLS sur la table completed_days
ALTER TABLE completed_days DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer les politiques existantes (optionnel, pour nettoyer)
DROP POLICY IF EXISTS "Users can only access their own completed days" ON completed_days;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON completed_days;
DROP POLICY IF EXISTS "Enable all access for authenticated users on completed_days" ON completed_days;

-- 3. Vérifier que le RLS est bien désactivé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'completed_days';

-- Si rowsecurity = false, alors le RLS est désactivé

-- 4. (Optionnel) Créer une politique très permissive si besoin
-- CREATE POLICY "Allow all operations for authenticated users" ON completed_days
--     FOR ALL TO authenticated
--     USING (true)
--     WITH CHECK (true);

-- 5. (Optionnel) Réactiver le RLS avec la politique permissive
-- ALTER TABLE completed_days ENABLE ROW LEVEL SECURITY; 
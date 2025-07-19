-- PLAN FINAL DE SÉCURITÉ POUR LA BETA
-- profiles reste permissif (pour éviter les problèmes de connexion)
-- Mais on sécurise toutes les données de progression utilisateur

-- Garder profiles en mode permissif (pour la connexion)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ETAPE 3 : Sécuriser les tables de progression utilisateur
-- Ces tables sont critiques car elles contiennent les données de jeu

-- Table progression_exercice
ALTER TABLE progression_exercice DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON progression_exercice;

CREATE POLICY "Users can only access their own exercise progress" ON progression_exercice
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

ALTER TABLE progression_exercice ENABLE ROW LEVEL SECURITY;

-- Table completed_days  
ALTER TABLE completed_days DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON completed_days;

CREATE POLICY "Users can only access their own completed days" ON completed_days
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

ALTER TABLE completed_days ENABLE ROW LEVEL SECURITY;

-- RÉSUMÉ SÉCURITÉ APRÈS APPLICATION :
-- ✅ SÉCURISÉ : clans, programmes, jours, exercices, quotes, blog (lecture seule auth)
-- ✅ SÉCURISÉ : progression_exercice, completed_days (par utilisateur)
-- ⚠️ PERMISSIF : profiles (nécessaire pour la connexion)

-- Pour plus tard : profiles peut être sécurisé avec des triggers côté serveur
-- ou en modifiant le processus d'authentification de l'app 
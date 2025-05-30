-- ETAPE 1 : Tables de lecture seule (sans risque)
-- Ces tables peuvent être mises en sécurité immédiatement

-- Désactiver RLS temporairement pour faire le ménage
ALTER TABLE clans DISABLE ROW LEVEL SECURITY;
ALTER TABLE programmes DISABLE ROW LEVEL SECURITY;
ALTER TABLE jours DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercices DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON clans;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON programmes;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON jours;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON exercices;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON quotes;
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON blog;

-- Créer les nouvelles policies sécurisées pour lecture seule
CREATE POLICY "Allow read access for authenticated users" ON clans
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow read access for authenticated users" ON programmes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow read access for authenticated users" ON jours
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow read access for authenticated users" ON exercices
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow read access for authenticated users" ON quotes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow read access for authenticated users" ON blog
    FOR SELECT TO authenticated
    USING (true);

-- Réactiver RLS
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jours ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog ENABLE ROW LEVEL SECURITY;

-- ETAPE 2 : Table profiles (la plus critique)
-- À appliquer APRÈS avoir testé l'étape 1

-- Désactiver RLS temporairement
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer l'ancienne policy
-- DROP POLICY IF EXISTS "Enable all access for authenticated user" ON profiles;

-- Policy sécurisée : chaque utilisateur ne peut accéder qu'à son propre profil
-- CREATE POLICY "Users can only access their own profile" ON profiles
--     FOR ALL TO authenticated
--     USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);

-- Réactiver RLS
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ETAPE 3 : Tables de progression utilisateur
-- À appliquer APRÈS avoir testé l'étape 2

-- progression_exercice
-- ALTER TABLE progression_exercice DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Enable all access for authenticated user" ON progression_exercice;

-- CREATE POLICY "Users can only access their own exercise progress" ON progression_exercice
--     FOR ALL TO authenticated
--     USING (user_id = auth.uid())
--     WITH CHECK (user_id = auth.uid());

-- ALTER TABLE progression_exercice ENABLE ROW LEVEL SECURITY;

-- completed_days
-- ALTER TABLE completed_days DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Enable all access for authenticated user" ON completed_days;

-- CREATE POLICY "Users can only access their own completed days" ON completed_days
--     FOR ALL TO authenticated
--     USING (user_id = auth.uid())
--     WITH CHECK (user_id = auth.uid());

-- ALTER TABLE completed_days ENABLE ROW LEVEL SECURITY; 
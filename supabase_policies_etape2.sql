-- ETAPE 2 : Sécurisation de la table profiles
-- ⚠️ CRITIQUE : Chaque utilisateur ne peut accéder qu'à son propre profil

-- Désactiver RLS temporairement
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer l'ancienne policy permissive
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON profiles;

-- Policy sécurisée : chaque utilisateur ne peut accéder qu'à son propre profil
CREATE POLICY "Users can only access their own profile" ON profiles
    FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Réactiver RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 🧪 TEST APRÈS APPLICATION :
-- 1. Connexion/déconnexion
-- 2. Changement de clan
-- 3. Modification du profil dans l'écran Compte
-- 4. Progression des exercices (utilise profiles pour les stats) 
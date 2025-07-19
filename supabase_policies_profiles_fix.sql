-- ETAPE 2 CORRIGÉE : Policies granulaires pour profiles
-- Permet la connexion tout en gardant la sécurité

-- Supprimer toutes les policies existantes sur profiles
DROP POLICY IF EXISTS "Enable all access for authenticated user" ON profiles;
DROP POLICY IF EXISTS "Users can only access their own profile" ON profiles;

-- Policy pour LIRE son propre profil
CREATE POLICY "Users can read their own profile" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Policy pour CRÉER son propre profil (important pour la connexion)
CREATE POLICY "Users can create their own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy pour MODIFIER son propre profil
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy pour SUPPRIMER son propre profil (optionnel)
CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE TO authenticated
    USING (auth.uid() = id);

-- Réactiver RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 
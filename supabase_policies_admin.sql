-- POLICIES ADMIN pour le backoffice
-- À appliquer APRÈS avoir testé l'app mobile

-- Supposons que tu aies un champ "role" dans ta table profiles
-- ou que tu utilises un email admin spécifique

-- Option A : Si tu as un champ "role" dans profiles
-- CREATE POLICY "Allow admin full access to programmes" ON programmes
--     FOR ALL TO authenticated
--     USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() 
--             AND role = 'admin'
--         )
--     )
--     WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() 
--             AND role = 'admin'
--         )
--     );

-- Option B : Si tu utilises un email admin spécifique
CREATE POLICY "Allow admin full access to programmes" ON programmes
    FOR ALL TO authenticated
    USING (auth.email() = 'TON_EMAIL_ADMIN@example.com')
    WITH CHECK (auth.email() = 'TON_EMAIL_ADMIN@example.com');

CREATE POLICY "Allow admin full access to exercices" ON exercices
    FOR ALL TO authenticated
    USING (auth.email() = 'TON_EMAIL_ADMIN@example.com')
    WITH CHECK (auth.email() = 'TON_EMAIL_ADMIN@example.com');

CREATE POLICY "Allow admin full access to jours" ON jours
    FOR ALL TO authenticated
    USING (auth.email() = 'TON_EMAIL_ADMIN@example.com')
    WITH CHECK (auth.email() = 'TON_EMAIL_ADMIN@example.com');

CREATE POLICY "Allow admin full access to blog" ON blog
    FOR ALL TO authenticated
    USING (auth.email() = 'TON_EMAIL_ADMIN@example.com')
    WITH CHECK (auth.email() = 'TON_EMAIL_ADMIN@example.com');

CREATE POLICY "Allow admin full access to quotes" ON quotes
    FOR ALL TO authenticated
    USING (auth.email() = 'TON_EMAIL_ADMIN@example.com')
    WITH CHECK (auth.email() = 'TON_EMAIL_ADMIN@example.com');

-- Option C : Si ton backoffice utilise un service_role
-- Pas besoin de policies, le service_role bypass RLS automatiquement 
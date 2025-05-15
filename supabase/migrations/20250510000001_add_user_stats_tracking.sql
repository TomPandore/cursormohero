/*
  # Ajout du suivi des statistiques utilisateur
  
  1. Changements
    - Ajout de champs à la table profiles pour suivre les statistiques cumulées
    - Création d'une table completed_days pour l'historique des jours complétés
    - Ajout d'un champ catégorie à la table exercices
    
  2. Sécurité
    - Politiques RLS pour la nouvelle table
*/

-- Ajout des colonnes dans profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS consecutive_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_days_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_completed_day DATE;

-- Création de la table completed_days
CREATE TABLE IF NOT EXISTS completed_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at DATE DEFAULT CURRENT_DATE,
  clan_id UUID REFERENCES clans(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ajout d'un index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_completed_days_user_id ON completed_days(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_days_completed_at ON completed_days(completed_at);

-- Ajout du champ catégorie à la table exercices
ALTER TABLE exercices ADD COLUMN IF NOT EXISTS categorie VARCHAR(50);

-- Activer RLS sur la nouvelle table
ALTER TABLE completed_days ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour la nouvelle table
CREATE POLICY "Enable all access for authenticated users on completed_days"
  ON completed_days
  FOR ALL
  TO authenticated
  USING (
    auth.role() = 'authenticated'
  )
  WITH CHECK (
    auth.role() = 'authenticated'
  ); 
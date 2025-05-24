/*
  # Ajout du champ initiation_completed
  
  1. Changements
    - Ajout de la colonne initiation_completed à la table profiles
    - Cette colonne permet de suivre si l'utilisateur a terminé son initiation
    
  2. Sécurité
    - Aucune modification des politiques RLS nécessaire
*/

-- Ajouter la colonne initiation_completed
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS initiation_completed BOOLEAN DEFAULT FALSE;

-- Commenter pour clarifier l'usage de la colonne
COMMENT ON COLUMN profiles.initiation_completed IS 'Indique si l''utilisateur a terminé son programme d''initiation MoHero'; 
/*
  # Add clan theme color and update clan data

  1. Changes
    - Add couleur_theme column to clans table
    - Add default theme colors for existing clans
*/

ALTER TABLE clans ADD COLUMN IF NOT EXISTS couleur_theme text;

-- Update existing clans with theme colors
UPDATE clans 
SET couleur_theme = CASE 
  WHEN nom_clan = 'ONOTKA' THEN '#F77C6F'
  WHEN nom_clan = 'EKLOA' THEN '#4CC3FF'
  WHEN nom_clan = 'OKWÁHO' THEN '#4FD1C5'
  ELSE '#8C6FF7'
END;
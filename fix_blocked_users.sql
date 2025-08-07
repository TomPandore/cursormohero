-- Script pour corriger les utilisateurs bloqués sur des jours complétés
-- Ce script synchronise les données de progression incohérentes

-- 1. Identifier les utilisateurs potentiellement bloqués
-- (ceux qui ont une last_completed_day récente mais currentDay non mis à jour)

SELECT 
  id,
  name,
  email,
  progress->>'currentDay' as current_day_json,
  last_completed_day,
  EXTRACT(DAY FROM (NOW() - last_completed_day)) as days_since_completion
FROM profiles 
WHERE 
  last_completed_day IS NOT NULL 
  AND EXTRACT(DAY FROM (NOW() - last_completed_day)) >= 1
  AND progress->>'currentDay' IS NOT NULL
ORDER BY last_completed_day DESC;

-- 2. Corriger automatiquement les utilisateurs bloqués
-- (ATTENTION: Exécuter seulement après avoir vérifié les résultats de la requête ci-dessus)

/*
UPDATE profiles 
SET progress = jsonb_set(
  progress,
  '{currentDay}',
  to_jsonb((progress->>'currentDay')::int + 1)
)
WHERE 
  last_completed_day IS NOT NULL 
  AND EXTRACT(DAY FROM (NOW() - last_completed_day)) >= 1
  AND progress->>'currentDay' IS NOT NULL
  AND (progress->>'currentDay')::int < 
    (SELECT MAX(numero_jour) FROM jours WHERE programme_id = profiles.programme_id);

-- 3. Mettre à jour lastUpdated dans le progress JSONB
UPDATE profiles 
SET progress = jsonb_set(
  progress,
  '{lastUpdated}',
  to_jsonb(NOW()::text)
)
WHERE 
  last_completed_day IS NOT NULL 
  AND EXTRACT(DAY FROM (NOW() - last_completed_day)) >= 1;
*/

-- 4. Vérifier les corrections (à exécuter après les UPDATE)
/*
SELECT 
  id,
  name,
  email,
  progress->>'currentDay' as current_day_after_fix,
  last_completed_day,
  progress->>'lastUpdated' as last_updated_after_fix
FROM profiles 
WHERE 
  last_completed_day IS NOT NULL 
  AND EXTRACT(DAY FROM (NOW() - last_completed_day)) >= 1
ORDER BY last_completed_day DESC;
*/
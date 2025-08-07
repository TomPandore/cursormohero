-- Script pour débloquer l'utilisateur spécifique ID: 3bf21838-b0a7-4c93-8777-6145b945ee69
-- Passage du jour 4 au jour 5

-- 1. VÉRIFICATION de l'état actuel de l'utilisateur
SELECT 
  id,
  name,
  email,
  progress->>'currentDay' as current_day_before,
  progress->>'totalCompletedDays' as total_completed_days_before,
  last_completed_day,
  programme_id,
  total_days_completed
FROM profiles 
WHERE id = '3bf21838-b0a7-4c93-8777-6145b945ee69';

-- 2. VÉRIFICATION que le programme permet le jour 5 (programme de 50 jours)
SELECT p.id as programme_id, p.nom, p.duree_jours
FROM profiles prof
JOIN programmes p ON prof.programme_id = p.id
WHERE prof.id = '3bf21838-b0a7-4c93-8777-6145b945ee69';

-- 3. CORRECTION - Passer du jour 4 au jour 5
UPDATE profiles 
SET progress = jsonb_set(
  jsonb_set(
    progress,
    '{currentDay}',
    '5'
  ),
  '{lastUpdated}',
  to_jsonb(NOW()::text)
)
WHERE id = '3bf21838-b0a7-4c93-8777-6145b945ee69'
AND progress->>'currentDay' = '4';

-- 4. VÉRIFICATION après correction
SELECT 
  id,
  name,
  email,
  progress->>'currentDay' as current_day_after,
  progress->>'totalCompletedDays' as total_completed_days_after,
  progress->>'lastUpdated' as last_updated_after,
  last_completed_day,
  programme_id
FROM profiles 
WHERE id = '3bf21838-b0a7-4c93-8777-6145b945ee69';

-- 5. OPTIONNEL - Si tu veux aussi mettre à jour la date de dernière complétion
-- (pour éviter que checkAndAdvanceDay() le fasse repasser au jour 4)
/*
UPDATE profiles 
SET last_completed_day = CURRENT_DATE
WHERE id = '3bf21838-b0a7-4c93-8777-6145b945ee69';
*/
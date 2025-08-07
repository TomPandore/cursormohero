-- Script SÉCURISÉ pour faire passer l'utilisateur au jour suivant
-- Simule exactement ce que ferait checkAndAdvanceDay() automatiquement
-- ID utilisateur: 3bf21838-b0a7-4c93-8777-6145b945ee69

-- 1. VÉRIFICATION de l'état actuel
SELECT 
  id,
  name,
  email,
  progress as progress_before
FROM profiles 
WHERE id = '3bf21838-b0a7-4c93-8777-6145b945ee69';

-- 2. PASSAGE AU JOUR SUIVANT (simule checkAndAdvanceDay)
-- Structure exacte respectée : currentDay, lastUpdated, completedDate, totalCompletedDays
UPDATE profiles 
SET progress = jsonb_build_object(
  'currentDay', ((progress->>'currentDay')::int + 1),
  'lastUpdated', NOW()::text,
  'completedDate', null,
  'totalCompletedDays', ((progress->>'totalCompletedDays')::int + 1)
)
WHERE id = '3bf21838-b0a7-4c93-8777-6145b945ee69'
AND progress->>'currentDay' = '4';

-- 3. VÉRIFICATION après passage
SELECT 
  id,
  name,
  email,
  progress as progress_after,
  progress->>'currentDay' as current_day,
  progress->>'totalCompletedDays' as total_completed_days
FROM profiles 
WHERE id = '3bf21838-b0a7-4c93-8777-6145b945ee69';
-- Script SÉCURISÉ pour faire passer l'utilisateur au jour suivant
-- Simule exactement ce que ferait checkAndAdvanceDay() automatiquement
-- ID utilisateur: f0c20116-4a4d-41f4-9308-4974e23195b8 (actuellement jour 2)

-- 1. VÉRIFICATION de l'état actuel
SELECT 
  id,
  name,
  email,
  progress as progress_before
FROM profiles 
WHERE id = 'f0c20116-4a4d-41f4-9308-4974e23195b8';

-- 2. PASSAGE AU JOUR SUIVANT (jour 2 → jour 3)
-- Structure exacte respectée : currentDay, lastUpdated, completedDate, totalCompletedDays
UPDATE profiles 
SET progress = jsonb_build_object(
  'currentDay', ((progress->>'currentDay')::int + 1),
  'lastUpdated', NOW()::text,
  'completedDate', null,
  'totalCompletedDays', ((progress->>'totalCompletedDays')::int + 1)
)
WHERE id = 'f0c20116-4a4d-41f4-9308-4974e23195b8'
AND progress->>'currentDay' = '2';

-- 3. VÉRIFICATION après passage
SELECT 
  id,
  name,
  email,
  progress as progress_after,
  progress->>'currentDay' as current_day,
  progress->>'totalCompletedDays' as total_completed_days
FROM profiles 
WHERE id = 'f0c20116-4a4d-41f4-9308-4974e23195b8';
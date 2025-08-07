-- Script SÉCURISÉ pour faire passer l'utilisateur au jour suivant
-- Simule exactement ce que ferait checkAndAdvanceDay() automatiquement
-- ID utilisateur: 084dc7d2-a3c8-4ee3-a347-1b16166caa59 (actuellement jour 4)

-- 1. VÉRIFICATION de l'état actuel
SELECT 
  id,
  name,
  email,
  progress as progress_before
FROM profiles 
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59';

-- 2. PASSAGE AU JOUR SUIVANT (jour 4 → jour 5)
-- Structure exacte respectée : currentDay, lastUpdated, completedDate, totalCompletedDays
UPDATE profiles 
SET progress = jsonb_build_object(
  'currentDay', ((progress->>'currentDay')::int + 1),
  'lastUpdated', NOW()::text,
  'completedDate', null,
  'totalCompletedDays', ((progress->>'totalCompletedDays')::int + 1)
)
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59'
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
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59';
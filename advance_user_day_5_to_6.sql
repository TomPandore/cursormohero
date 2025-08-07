-- Script SÉCURISÉ pour faire passer l'utilisateur au jour suivant
-- Simule exactement ce que ferait checkAndAdvanceDay() automatiquement
-- ID utilisateur: 084dc7d2-a3c8-4ee3-a347-1b16166caa59 (actuellement jour 5)

-- 1. VÉRIFICATION de l'état actuel
SELECT 
  id,
  name,
  email,
  progress as progress_before,
  progress->>'currentDay' as current_day_before,
  progress->>'totalCompletedDays' as total_completed_days_before
FROM profiles 
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59';

-- 2. PASSAGE AU JOUR SUIVANT (jour 5 → jour 6)
-- Structure exacte respectée : currentDay, lastUpdated, completedDate, totalCompletedDays
UPDATE profiles 
SET progress = jsonb_build_object(
  'currentDay', ((progress->>'currentDay')::int + 1),
  'lastUpdated', NOW()::text,
  'completedDate', null,
  'totalCompletedDays', ((progress->>'totalCompletedDays')::int + 1)
)
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59'
AND progress->>'currentDay' = '5';

-- 3. VÉRIFICATION après passage
SELECT 
  id,
  name,
  email,
  progress as progress_after,
  progress->>'currentDay' as current_day_after,
  progress->>'totalCompletedDays' as total_completed_days_after
FROM profiles 
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59';

-- 4. VÉRIFICATION SUPPLÉMENTAIRE: S'assurer que last_completed_day est aussi à jour
-- (Important pour que checkAndAdvanceDay fonctionne correctement)
UPDATE profiles 
SET last_completed_day = NOW()
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59';

-- 5. VÉRIFICATION FINALE
SELECT 
  id,
  name,
  progress->>'currentDay' as current_day,
  progress->>'totalCompletedDays' as total_completed_days,
  last_completed_day
FROM profiles 
WHERE id = '084dc7d2-a3c8-4ee3-a347-1b16166caa59';
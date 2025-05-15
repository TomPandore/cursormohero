import { supabase } from './supabase';

/**
 * Interface pour les statistiques utilisateur
 */
export interface UserStats {
  consecutiveDays: number;
  totalDaysCompleted: number;
  totalPushups: number;
  totalSquats: number;
  totalBreathingExercises: number;
}

/**
 * Marque une journée comme complétée pour un utilisateur
 * Incrémente également les compteurs de jours consécutifs et le total de jours
 */
export const markDayAsCompleted = async (userId: string, clanId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Vérifier si le jour n'a pas déjà été marqué comme complété
    const { data: existingDay, error: checkError } = await supabase
      .from('completed_days')
      .select('*')
      .eq('user_id', userId)
      .eq('completed_at', today)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No rows returned
      console.error('Erreur lors de la vérification du jour complété:', checkError);
      return false;
    }
    
    // Si le jour est déjà marqué comme complété, ne rien faire
    if (existingDay) {
      console.log('Jour déjà marqué comme complété');
      return true;
    }
    
    // 1. Enregistrer le jour complété
    const { error: insertError } = await supabase
      .from('completed_days')
      .insert({
        user_id: userId,
        clan_id: clanId,
        completed_at: today
      });
    
    if (insertError) {
      console.error('Erreur lors de l\'enregistrement du jour complété:', insertError);
      return false;
    }
    
    // 2. Récupérer les informations actuelles du profil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('last_completed_day, consecutive_days, total_days_completed')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return false;
    }
    
    let consecutiveDays = profileData?.consecutive_days || 0;
    let totalDaysCompleted = profileData?.total_days_completed || 0;
    
    // 3. Vérifier si on maintient la série de jours consécutifs
    if (profileData?.last_completed_day) {
      const lastCompletedDate = new Date(profileData.last_completed_day);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Si le dernier jour était hier, on maintient la série
      if (lastCompletedDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        consecutiveDays += 1;
      } else {
        // Sinon, on recommence à 1
        consecutiveDays = 1;
      }
    } else {
      // Premier jour complété
      consecutiveDays = 1;
    }
    
    // 4. Mettre à jour le profil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        last_completed_day: today,
        consecutive_days: consecutiveDays,
        total_days_completed: totalDaysCompleted + 1
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour du profil:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur inattendue lors du marquage du jour comme complété:', error);
    return false;
  }
};

/**
 * Récupère les statistiques d'un utilisateur
 */
export const fetchUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // Récupérer les informations de profil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('consecutive_days, total_days_completed')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
    }
    
    // Récupérer toutes les données de progression d'exercices de l'utilisateur
    const { data: progressionData, error: progressionError } = await supabase
      .from('progression_exercice')
      .select(`
        valeur_realisee,
        exercice_id
      `)
      .eq('user_id', userId);
    
    if (progressionError) {
      console.error('Erreur lors de la récupération des progressions:', progressionError);
    }
    
    // Si nous avons des données de progression, récupérer les détails des exercices correspondants
    let totalPushups = 0;
    let totalSquats = 0;
    let totalBreathingExercises = 0;
    
    if (progressionData && progressionData.length > 0) {
      const exerciceIds = [...new Set(progressionData.map(p => p.exercice_id))];
      
      const { data: exercicesData, error: exercicesError } = await supabase
        .from('exercices')
        .select('id, nom, type, categorie')
        .in('id', exerciceIds);
      
      if (exercicesError) {
        console.error('Erreur lors de la récupération des exercices:', exercicesError);
      } else if (exercicesData) {
        // Traiter chaque progression avec les infos d'exercice correspondantes
        progressionData.forEach(progression => {
          const exercice = exercicesData.find(e => e.id === progression.exercice_id);
          
          if (exercice) {
            // Vérifier d'abord la catégorie explicite si disponible
            if (exercice.categorie) {
              const categorie = exercice.categorie.toLowerCase();
              if (categorie === 'pompes' || categorie === 'push-up' || categorie === 'pectoraux') {
                totalPushups += progression.valeur_realisee;
              } else if (categorie === 'squats' || categorie === 'jambes' || categorie === 'legs') {
                totalSquats += progression.valeur_realisee;
              } else if (categorie === 'respiration' || categorie === 'breathing' || categorie === 'meditation') {
                totalBreathingExercises += progression.valeur_realisee;
              }
            } else {
              // Fallback: utiliser nom et type pour déduire la catégorie
              const nomExercice = exercice.nom?.toLowerCase() || '';
              const typeExercice = exercice.type?.toLowerCase() || '';
              
              if (nomExercice.includes('pompe') || typeExercice.includes('pompe') || 
                  nomExercice.includes('push-up') || typeExercice === 'push-up' || 
                  nomExercice.includes('pectoraux')) {
                totalPushups += progression.valeur_realisee;
              } else if (nomExercice.includes('squat') || typeExercice.includes('squat') || 
                          nomExercice.includes('jambe') || typeExercice.includes('jambe') || 
                          nomExercice.includes('leg') || typeExercice.includes('leg')) {
                totalSquats += progression.valeur_realisee;
              } else if (nomExercice.includes('respiration') || nomExercice.includes('souffle') || 
                          typeExercice.includes('respiration') || typeExercice.includes('breathing') || 
                          nomExercice.includes('breathing') || nomExercice.includes('méditation') || 
                          typeExercice.includes('méditation')) {
                totalBreathingExercises += progression.valeur_realisee;
              }
            }
          }
        });
      }
    }
    
    return {
      consecutiveDays: profileData?.consecutive_days || 0,
      totalDaysCompleted: profileData?.total_days_completed || 0,
      totalPushups,
      totalSquats,
      totalBreathingExercises
    };
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des statistiques:', error);
    return {
      consecutiveDays: 0,
      totalDaysCompleted: 0,
      totalPushups: 0,
      totalSquats: 0,
      totalBreathingExercises: 0
    };
  }
}; 
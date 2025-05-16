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
 * Récupère les statistiques d'un utilisateur directement depuis son profil
 */
export const fetchUserStats = async (userId: string): Promise<UserStats> => {
  try {
    console.log('Récupération des statistiques utilisateur depuis le profil:', userId);
    
    // Récupérer les informations de profil avec les statistiques
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('consecutive_days, total_days_completed, stats_pompes, stats_squats, stats_respiration')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      throw profileError;
    }
    
    console.log('Données du profil récupérées:', profileData);
    
    // Utiliser les nouvelles colonnes de statistiques
    const stats = {
      consecutiveDays: profileData?.consecutive_days || 0,
      totalDaysCompleted: profileData?.total_days_completed || 0,
      totalPushups: profileData?.stats_pompes || 0,
      totalSquats: profileData?.stats_squats || 0,
      totalBreathingExercises: profileData?.stats_respiration || 0
    };
    
    console.log('Statistiques utilisateur:', stats);
    
    return stats;
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

/**
 * Met à jour les statistiques d'exercices dans le profil utilisateur
 */
export const updateExerciseStats = async (userId: string, exerciseId: string, reps: number): Promise<boolean> => {
  try {
    console.log(`Mise à jour des statistiques pour l'exercice ${exerciseId}, +${reps} répétitions`);
    
    // 1. Récupérer l'information sur l'exercice
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercices')
      .select('id, nom, type, categorie')
      .eq('id', exerciseId)
      .single();
    
    if (exerciseError) {
      console.error('Erreur lors de la récupération des informations de l\'exercice:', exerciseError);
      return false;
    }
    
    // 2. Déterminer quel type de statistique mettre à jour
    const type = (exerciseData.type || '').toLowerCase();
    const categorie = (exerciseData.categorie || '').toLowerCase();
    const nom = (exerciseData.nom || '').toLowerCase();
    
    let statsField = null;
    
    // Utiliser tous les critères pour déterminer le type d'exercice
    if (
      categorie === 'pompes' || 
      type === 'push' || 
      type.includes('pompe') || 
      nom.includes('pompe') || 
      nom.includes('push-up')
    ) {
      statsField = 'stats_pompes';
    } else if (
      categorie === 'squats' || 
      type === 'legs' || 
      type.includes('squat') || 
      nom.includes('squat') || 
      nom.includes('jambe')
    ) {
      statsField = 'stats_squats';
    } else if (
      categorie === 'respiration' || 
      type === 'breathing' || 
      type.includes('respiration') || 
      nom.includes('respiration') || 
      nom.includes('souffle')
    ) {
      statsField = 'stats_respiration';
    } else {
      console.log('Type d\'exercice non reconnu, pas de statistique à mettre à jour');
      return false;
    }
    
    console.log(`Type d'exercice identifié: ${statsField}`);
    
    // 3. Récupérer la valeur actuelle
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(statsField)
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return false;
    }
    
    // 4. Calculer la nouvelle valeur
    const currentValue = profileData[statsField] || 0;
    const newValue = currentValue + reps;
    
    console.log(`Valeur actuelle: ${currentValue}, nouvelle valeur: ${newValue}`);
    
    // 5. Mettre à jour le profil
    const updateData: Record<string, number> = {};
    updateData[statsField] = newValue;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour des statistiques:', updateError);
      return false;
    }
    
    console.log('Statistiques mises à jour avec succès');
    return true;
    
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour des statistiques:', error);
    return false;
  }
}; 
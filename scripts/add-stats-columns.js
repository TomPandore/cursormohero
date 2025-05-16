/**
 * Script pour ajouter les colonnes de statistiques directement dans la table profiles
 * 
 * Ce script ajoute:
 * - stats_pompes: Le total de pompes effectuées
 * - stats_squats: Le total de squats effectués
 * - stats_respiration: Le total d'exercices de respiration effectués
 * 
 * Utilisation:
 * node scripts/add-stats-columns.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Utiliser les informations de connexion Supabase de l'application
const config = require('../app.json');
const supabaseUrl = config.expo.extra.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = config.expo.extra.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connexion à Supabase URL:', supabaseUrl);

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== Ajout des colonnes de statistiques dans la table profiles ===');
  
  try {
    // Exécuter la requête SQL pour ajouter les colonnes
    await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS stats_pompes INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stats_squats INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stats_respiration INTEGER DEFAULT 0;
      `
    });
    
    console.log('✅ Colonnes ajoutées avec succès.');
    
    // Maintenant, calculer et initialiser les valeurs à partir des données existantes
    console.log('Initialisation des statistiques pour tous les utilisateurs...');
    
    // Récupérer tous les utilisateurs
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id');
      
    if (error) {
      throw error;
    }
    
    console.log(`${profiles.length} utilisateurs trouvés.`);
    
    // Pour chaque utilisateur, calculer et mettre à jour ses statistiques
    let successCount = 0;
    
    for (const profile of profiles) {
      try {
        // Récupérer toutes les progressions d'exercices de l'utilisateur
        const { data: progressions, error: progressionsError } = await supabase
          .from('progression_exercice')
          .select('exercice_id, valeur_realisee')
          .eq('user_id', profile.id);
          
        if (progressionsError) {
          console.error(`Erreur lors de la récupération des progressions pour l'utilisateur ${profile.id}:`, progressionsError);
          continue;
        }
        
        if (!progressions || progressions.length === 0) {
          console.log(`Pas de progressions trouvées pour l'utilisateur ${profile.id}.`);
          continue;
        }
        
        // Récupérer les exercices correspondants
        const exerciceIds = [...new Set(progressions.map(p => p.exercice_id))];
        
        const { data: exercices, error: exercicesError } = await supabase
          .from('exercices')
          .select('id, nom, type, categorie')
          .in('id', exerciceIds);
          
        if (exercicesError) {
          console.error(`Erreur lors de la récupération des exercices pour l'utilisateur ${profile.id}:`, exercicesError);
          continue;
        }
        
        // Créer une map des exercices pour un accès rapide
        const exercicesMap = new Map();
        exercices.forEach(ex => {
          exercicesMap.set(ex.id, ex);
        });
        
        // Calculer les totaux
        let totalPompes = 0;
        let totalSquats = 0;
        let totalRespiration = 0;
        
        // Pour chaque progression
        for (const progression of progressions) {
          const exercice = exercicesMap.get(progression.exercice_id);
          
          if (exercice) {
            const type = (exercice.type || '').toLowerCase();
            const categorie = (exercice.categorie || '').toLowerCase();
            const nom = (exercice.nom || '').toLowerCase();
            
            // Utiliser tous les critères pour déterminer le type d'exercice
            if (
              categorie === 'pompes' || 
              type === 'push' || 
              type.includes('pompe') || 
              nom.includes('pompe') || 
              nom.includes('push-up')
            ) {
              totalPompes += progression.valeur_realisee;
            } else if (
              categorie === 'squats' || 
              type === 'legs' || 
              type.includes('squat') || 
              nom.includes('squat') || 
              nom.includes('jambe')
            ) {
              totalSquats += progression.valeur_realisee;
            } else if (
              categorie === 'respiration' || 
              type === 'breathing' || 
              type.includes('respiration') || 
              nom.includes('respiration') || 
              nom.includes('souffle')
            ) {
              totalRespiration += progression.valeur_realisee;
            }
          }
        }
        
        // Mettre à jour le profil avec les statistiques calculées
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stats_pompes: totalPompes,
            stats_squats: totalSquats,
            stats_respiration: totalRespiration
          })
          .eq('id', profile.id);
          
        if (updateError) {
          console.error(`Erreur lors de la mise à jour des statistiques pour l'utilisateur ${profile.id}:`, updateError);
        } else {
          console.log(`✅ Statistiques mises à jour pour l'utilisateur ${profile.id}:`);
          console.log(`   - Pompes: ${totalPompes}`);
          console.log(`   - Squats: ${totalSquats}`);
          console.log(`   - Respiration: ${totalRespiration}`);
          successCount++;
        }
        
      } catch (error) {
        console.error(`Erreur lors du traitement de l'utilisateur ${profile.id}:`, error);
      }
    }
    
    console.log(`\nMise à jour terminée. ${successCount}/${profiles.length} utilisateurs mis à jour avec succès.`);
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  }
}

// Exécuter le script principal
main(); 
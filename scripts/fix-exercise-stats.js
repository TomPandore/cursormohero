/**
 * Script de correction des statistiques d'exercices
 * 
 * Ce script permet de:
 * 1. Vérifier et corriger les catégories des exercices
 * 2. Recalculer les totaux pour les pompes, squats et exercices de respiration
 * 3. Afficher un résumé des statistiques pour chaque utilisateur
 * 
 * Utilisation:
 * node scripts/fix-exercise-stats.js
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
  console.log('=== Correction des statistiques d\'exercices ===');
  
  try {
    await categorizeExercises();
    await recalculateStats();
    console.log('Script terminé avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  }
}

/**
 * Vérifie et corrige les catégories des exercices
 */
async function categorizeExercises() {
  console.log('\n=== Vérification et correction des catégories d\'exercices ===');
  
  try {
    // Récupérer tous les exercices
    const { data: exercices, error } = await supabase
      .from('exercices')
      .select('id, nom, type, categorie');
      
    if (error) {
      throw error;
    }
    
    console.log(`${exercices.length} exercices trouvés à vérifier.`);
    
    let updated = 0;
    
    // Catégoriser chaque exercice qui n'a pas de catégorie ou qui a une catégorie incorrecte
    for (const exercice of exercices) {
      const nom = (exercice.nom || '').toLowerCase();
      const type = (exercice.type || '').toLowerCase();
      let categorie = exercice.categorie;
      let shouldUpdate = false;
      
      // Déterminer si la catégorie doit être mise à jour
      if (!categorie) {
        shouldUpdate = true;
      } else {
        categorie = categorie.toLowerCase();
        
        // Vérifier si la catégorie est correcte pour un exercice de pompes
        if (
          nom.includes('pompe') || 
          type.includes('pompe') ||
          nom.includes('push-up') || 
          type === 'push-up' ||
          nom.includes('pectoraux') ||
          nom.includes('chest') ||
          nom.includes('bras') ||
          nom.includes('arm')
        ) {
          if (categorie !== 'pompes') {
            categorie = 'pompes';
            shouldUpdate = true;
          }
        } 
        // Vérifier si la catégorie est correcte pour un exercice de squats
        else if (
          nom.includes('squat') || 
          type.includes('squat') ||
          nom.includes('jambe') ||
          type.includes('jambe') ||
          nom.includes('leg') ||
          type.includes('leg') ||
          nom.includes('cuisse') ||
          nom.includes('thigh')
        ) {
          if (categorie !== 'squats') {
            categorie = 'squats';
            shouldUpdate = true;
          }
        } 
        // Vérifier si la catégorie est correcte pour un exercice de respiration
        else if (
          nom.includes('respiration') || 
          nom.includes('souffle') ||
          type.includes('respiration') ||
          nom.includes('breathing') ||
          type.includes('breathing') ||
          nom.includes('méditation') ||
          type.includes('méditation') ||
          nom.includes('meditation') ||
          type.includes('meditation')
        ) {
          if (categorie !== 'respiration') {
            categorie = 'respiration';
            shouldUpdate = true;
          }
        }
      }
      
      // Mettre à jour l'exercice si nécessaire
      if (shouldUpdate) {
        const finalCategorie = categorie || 'autre';
        const { error: updateError } = await supabase
          .from('exercices')
          .update({ categorie: finalCategorie })
          .eq('id', exercice.id);
          
        if (updateError) {
          console.error(`Erreur lors de la mise à jour de l'exercice ${exercice.id}:`, updateError);
        } else {
          console.log(`✓ Exercice "${exercice.nom}" mis à jour avec la catégorie "${finalCategorie}"`);
          updated++;
        }
      }
    }
    
    console.log(`${updated} exercices ont été mis à jour avec la catégorie correcte.`);
    console.log('Catégorisation des exercices terminée.');
  } catch (error) {
    console.error('Erreur lors de la catégorisation des exercices:', error);
  }
}

/**
 * Recalcule les statistiques pour chaque utilisateur
 */
async function recalculateStats() {
  console.log('\n=== Recalcul des statistiques utilisateur ===');
  
  try {
    // Récupérer tous les utilisateurs
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name');
      
    if (error) {
      throw error;
    }
    
    console.log(`${profiles.length} utilisateurs trouvés.`);
    
    // Pour chaque utilisateur
    for (const profile of profiles) {
      console.log(`\nCalcul des statistiques pour l'utilisateur: ${profile.name || profile.id}`);
      
      // Récupérer toutes les progressions d'exercices de l'utilisateur
      const { data: progressions, error: progressionsError } = await supabase
        .from('progression_exercice')
        .select('exercice_id, valeur_realisee')
        .eq('user_id', profile.id);
        
      if (progressionsError) {
        console.error(`Erreur lors de la récupération des progressions pour l'utilisateur ${profile.id}:`, progressionsError);
        continue;
      }
      
      console.log(`${progressions.length} enregistrements de progression trouvés.`);
      
      if (progressions.length === 0) {
        console.log('Aucune statistique à calculer.');
        continue;
      }
      
      // Récupérer les exercices correspondants
      const exerciceIds = [...new Set(progressions.map(p => p.exercice_id))];
      
      const { data: exercices, error: exercicesError } = await supabase
        .from('exercices')
        .select('id, nom, categorie')
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
      let totalPushups = 0;
      let totalSquats = 0;
      let totalBreathingExercises = 0;
      
      // Pour chaque progression
      for (const progression of progressions) {
        const exercice = exercicesMap.get(progression.exercice_id);
        
        if (exercice) {
          const categorie = (exercice.categorie || '').toLowerCase();
          
          if (categorie === 'pompes') {
            totalPushups += progression.valeur_realisee;
          } else if (categorie === 'squats') {
            totalSquats += progression.valeur_realisee;
          } else if (categorie === 'respiration') {
            totalBreathingExercises += progression.valeur_realisee;
          }
        }
      }
      
      // Afficher les résultats
      console.log(`Statistiques calculées pour ${profile.name || profile.id}:`);
      console.log(`- Pompes: ${totalPushups}`);
      console.log(`- Squats: ${totalSquats}`);
      console.log(`- Exercices de respiration: ${totalBreathingExercises}`);
    }
    
    console.log('\nRecalcul des statistiques terminé.');
  } catch (error) {
    console.error('Erreur lors du recalcul des statistiques:', error);
  }
}

// Exécuter le script principal
main(); 
/**
 * Script d'initialisation des statistiques utilisateur
 * 
 * Ce script permet de:
 * 1. Appliquer les migrations pour ajouter les champs et tables nécessaires
 * 2. Catégoriser les exercices existants (pompes, squats, respiration)
 * 3. Initialiser les compteurs de jours dans les profils utilisateur
 * 
 * Utilisation:
 * node scripts/init-user-stats.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Création du client Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Variables d\'environnement SUPABASE_URL et SUPABASE_KEY requises.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Applique les migrations pour le suivi des statistiques
 */
async function applyMigrations() {
  console.log('Application des migrations...');
  
  try {
    // 1. Ajouter les colonnes dans profiles
    await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS consecutive_days INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_days_completed INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_completed_day DATE;
      `
    });
    
    // 2. Créer la table completed_days
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS completed_days (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          completed_at DATE DEFAULT CURRENT_DATE,
          clan_id UUID REFERENCES clans(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
      `
    });
    
    // 3. Ajouter les index pour les recherches fréquentes
    await supabase.rpc('execute_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_completed_days_user_id ON completed_days(user_id);
        CREATE INDEX IF NOT EXISTS idx_completed_days_completed_at ON completed_days(completed_at);
      `
    });
    
    // 4. Ajouter le champ catégorie à la table exercices
    await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE exercices ADD COLUMN IF NOT EXISTS categorie VARCHAR(50);
      `
    });
    
    // 5. Activer RLS sur la nouvelle table
    await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE completed_days ENABLE ROW LEVEL SECURITY;
      `
    });
    
    // 6. Créer une politique pour la nouvelle table
    await supabase.rpc('execute_sql', {
      query: `
        CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users on completed_days"
        ON completed_days
        FOR ALL
        TO authenticated
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
      `
    });
    
    console.log('Migrations appliquées avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'application des migrations:', error);
  }
}

/**
 * Catégorise les exercices existants
 */
async function categorizeExercises() {
  console.log('Catégorisation des exercices...');
  
  try {
    // Récupérer tous les exercices
    const { data: exercices, error } = await supabase
      .from('exercices')
      .select('id, nom, type');
      
    if (error) {
      throw error;
    }
    
    console.log(`${exercices.length} exercices trouvés à catégoriser.`);
    
    // Catégoriser chaque exercice
    for (const exercice of exercices) {
      const nom = (exercice.nom || '').toLowerCase();
      const type = (exercice.type || '').toLowerCase();
      let categorie = null;
      
      // Déterminer la catégorie en fonction du nom et du type
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
        categorie = 'pompes';
      } 
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
        categorie = 'squats';
      } 
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
        categorie = 'respiration';
      } else {
        categorie = 'autre';
      }
      
      // Mettre à jour l'exercice
      const { error: updateError } = await supabase
        .from('exercices')
        .update({ categorie })
        .eq('id', exercice.id);
        
      if (updateError) {
        console.error(`Erreur lors de la mise à jour de l'exercice ${exercice.id}:`, updateError);
      }
    }
    
    console.log('Exercices catégorisés avec succès.');
  } catch (error) {
    console.error('Erreur lors de la catégorisation des exercices:', error);
  }
}

/**
 * Initialise les compteurs de jours dans les profils utilisateur
 */
async function initializeUserStats() {
  console.log('Initialisation des statistiques utilisateur...');
  
  try {
    // Récupérer tous les profils utilisateur
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, progress');
      
    if (error) {
      throw error;
    }
    
    console.log(`${profiles.length} profils trouvés à initialiser.`);
    
    // Initialiser chaque profil
    for (const profile of profiles) {
      const totalDaysCompleted = profile.progress?.totalCompletedDays || 0;
      
      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          consecutive_days: 0, // On commence à 0, sera mis à jour lors de la prochaine activité
          total_days_completed: totalDaysCompleted 
        })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error(`Erreur lors de la mise à jour du profil ${profile.id}:`, updateError);
      }
    }
    
    console.log('Statistiques utilisateur initialisées avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des statistiques utilisateur:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('=== INITIALISATION DES STATISTIQUES UTILISATEUR ===');
  
  try {
    await applyMigrations();
    await categorizeExercises();
    await initializeUserStats();
    
    console.log('Initialisation terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
  } finally {
    process.exit(0);
  }
}

// Lancer le script
main(); 
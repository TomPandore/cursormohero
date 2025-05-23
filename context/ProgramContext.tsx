import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Program, DailyRitual, UserProgram } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { markDayAsCompleted, updateExerciseStats } from '@/lib/statsUtils';
import { Platform } from 'react-native';
import { isSameDay, addDays } from '@/lib/dateUtils';
import { User } from '@/types';

interface ProgramContextProps {
  programs: Program[];
  currentProgram: Program | null;
  userPrograms: UserProgram[];
  isLoading: boolean;
  currentRitual: DailyRitual | null;
  selectProgram: (programId: string) => Promise<Program | void>;
  getCurrentDayRitual: () => Promise<DailyRitual | null>;
  updateExerciseProgress: (exerciseId: string, reps: number) => void;
  completeDay: () => Promise<boolean | void>;
}

const defaultContext: ProgramContextProps = {
  programs: [],
  currentProgram: null,
  userPrograms: [],
  isLoading: true,
  currentRitual: null,
  selectProgram: async () => {},
  getCurrentDayRitual: async () => null,
  updateExerciseProgress: () => {},
  completeDay: async () => {},
};

const ProgramContext = createContext<ProgramContextProps>(defaultContext);

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRitual, setCurrentRitual] = useState<DailyRitual | null>(null);
  const { user } = useAuth();

    const loadData = async () => {
      try {
      setIsLoading(true);
      
      // Récupérer l'utilisateur courant
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      let userProgrammeId = null;
      let currentDay = 1;
      
      if (user) {
        console.log('Utilisateur connecté, id:', user.id);
        
        // Récupérer le profil complet pour examiner sa structure
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        console.log('Profil utilisateur complet:', profile, 'Erreur:', profileError);
        
        if (!profileError && profile) {
          // Récupérer le programme_id
          userProgrammeId = profile.programme_id;
          console.log('programme_id du profil:', userProgrammeId, 'Type:', typeof userProgrammeId);
          
          // Vérifier que programme_id est une valeur valide
          if (!userProgrammeId) {
            console.log('Aucun programme_id trouvé dans le profil');
          } else {
            // S'assurer que programme_id est une chaîne de caractères
            userProgrammeId = String(userProgrammeId);
            console.log('programme_id converti en string:', userProgrammeId);
          }
          
          // Vérifier les champs de progression disponibles
          if (profile.progress && profile.progress.currentDay) {
            currentDay = profile.progress.currentDay;
            console.log('Jour courant depuis progress:', currentDay);
          }
        }
      } else {
        console.log('Aucun utilisateur connecté');
      }
      
      // Fetch programs from Supabase
      const { data: programsData, error: programsError } = await supabase
        .from('programmes')
        .select(`
          *,
          resultats,
          parcours_resume
        `);

      if (programsError) {
        console.error('Erreur lors de la récupération des programmes:', programsError);
        throw programsError;
      }
      
      console.log(`Nombre de programmes chargés: ${programsData?.length || 0}`);

      // Convert Supabase data to Program type
      const formattedPrograms: Program[] = programsData.map(p => {
        return {
          id: p.id,
          title: p.nom,
          description: p.description,
          duration: p.duree_jours,
          category: p.type === 'Découverte' ? 'discovery' : 'premium',
          focus: p.tags || [],
          imageUrl: p.image_url,
          details: {
            benefits: p.resultats || [],
            phases: p.parcours_resume?.map((phase: { titre: string; texte: string; sous_titre: string }) => ({
              title: phase.titre,
              description: `${phase.texte}\n${phase.sous_titre}`
            })) || []
          }
        };
      });

      setPrograms(formattedPrograms);
        
      // Mettre à jour le currentProgram selon le profil
      if (userProgrammeId) {
        console.log('Recherche du programme avec ID:', userProgrammeId);
        // Comparer les IDs comme des chaînes de caractères pour éviter les problèmes de type
        const found = formattedPrograms.find(p => String(p.id) === String(userProgrammeId));
        if (found) {
          console.log('Programme courant trouvé:', found.title, 'ID:', found.id);

          // PATCH: Toujours repartir à currentDay 1 quand on sélectionne un programme
          // On ignore le progress du profil si le programme_id a changé
          let shouldResetProgress = false;
          let profileCurrentDay = 1;
          let profileProgrammeId = null;
          if (typeof user !== 'undefined') {
            // On récupère le profil à nouveau pour être sûr d'avoir la bonne portée
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('progress, programme_id')
              .eq('id', user.id)
              .single();
            if (!profileError && profileData) {
              profileCurrentDay = profileData.progress?.currentDay || 1;
              profileProgrammeId = profileData.programme_id;
              if (profileCurrentDay > 1 && String(profileProgrammeId) !== String(found.id)) {
                shouldResetProgress = true;
              }
            }
          }

          // Initialiser userPrograms avec le programme actuel et le jour courant récupéré
          const userProgram = {
            programId: found.id,
            startDate: new Date(),
            currentDay: 1,
            completed: false,
            lastUpdated: new Date()
          };

          if (shouldResetProgress && typeof user !== 'undefined') {
            // Mettre à jour le profil pour repartir à 1
            await supabase
              .from('profiles')
              .update({ progress: { currentDay: 1, lastUpdated: new Date().toISOString(), completedDate: null, totalCompletedDays: 0 } })
              .eq('id', user.id);
            console.log('Progression réinitialisée à 1 pour le programme', found.id);
          }

          setCurrentProgram(found);
          setUserPrograms([userProgram]);
          setTimeout(() => {
            getCurrentDayRitual();
          }, 1000);
        } else {
          console.warn('Programme avec ID', userProgrammeId, 'introuvable dans la liste des programmes');
          
          // Vérifier si c'est un problème de format UUID vs string
          console.log('Liste des IDs de programmes disponibles:', formattedPrograms.map(p => String(p.id)));
          
          // Tentative de récupération par correspondance partielle ou par recherche exacte après normalisation
          const possibleMatch = formattedPrograms.find(p => {
            const normalizedProgramId = String(p.id).trim().toLowerCase();
            const normalizedUserProgramId = String(userProgrammeId).trim().toLowerCase();
            
            return normalizedProgramId === normalizedUserProgramId ||
              normalizedProgramId.includes(normalizedUserProgramId) || 
              normalizedUserProgramId.includes(normalizedProgramId);
          });
          
          if (possibleMatch) {
            console.log('Correspondance possible trouvée:', possibleMatch.title, 'ID:', possibleMatch.id);
            setCurrentProgram(possibleMatch);
            
            // Initialiser userPrograms avec le programme trouvé
            const userProgram = {
              programId: possibleMatch.id,
              startDate: new Date(),
              currentDay: currentDay,
              completed: false,
              lastUpdated: new Date()
            };
            
            console.log('Initialisation de userPrograms avec correspondance possible:', userProgram);
            setUserPrograms([userProgram]);
            
            // Mettre à jour le profil avec l'ID correct
            try {
              if (user) {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ programme_id: String(possibleMatch.id) })
                  .eq('id', user.id);
                  
                if (updateError) {
                  console.error('Erreur lors de la correction de l\'ID du programme:', updateError);
                } else {
                  console.log('ID du programme corrigé dans le profil');
                }
              } else {
                console.warn('Impossible de corriger l\'ID: aucun utilisateur connecté');
              }
            } catch (e) {
              console.error('Erreur lors de la tentative de correction de l\'ID:', e);
            }
          } else {
            setCurrentProgram(null);
            setUserPrograms([]);
          }
        }
      } else {
        console.log('Aucun programme sélectionné');
        setCurrentProgram(null);
        setUserPrograms([]);
      }
      } catch (error) {
        console.error('Failed to load programs:', error);
      } finally {
        setIsLoading(false);
      }
    };

  // Fonction pour vérifier et passer au jour suivant si un nouveau jour a commencé
  const checkAndAdvanceDay = async () => {
    try {
      if (!currentProgram || !userPrograms.length || !user?.id) {
        return;
      }
      const currentUserProgram = userPrograms[0];
      // Récupérer la date de dernière mise à jour depuis le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('progress, last_completed_day, programme_id')
        .eq('id', user.id)
        .single();
      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        return;
      }
      // Si aucune date de dernière complétion ou pas de progression, rien à faire
      if (!profileData.last_completed_day && !profileData.progress?.lastUpdated) {
        console.log('Aucune date de dernière complétion trouvée, pas de changement de jour');
        return;
      }
      // Utiliser last_completed_day en priorité, sinon utiliser lastUpdated
      const lastCompletionDate = profileData.last_completed_day 
        ? new Date(profileData.last_completed_day) 
        : new Date(profileData.progress?.lastUpdated);
      // Extraire seulement la date (sans l'heure)
      const lastCompletionDay = new Date(
        lastCompletionDate.getFullYear(),
        lastCompletionDate.getMonth(),
        lastCompletionDate.getDate()
      );
      // Date actuelle (sans l'heure)
      const today = new Date();
      const currentDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      // --- NOUVEAU : Vérifier que tous les exercices du jour sont validés ---
      // On récupère la progression des exercices du jour précédent
      if (currentDay > lastCompletionDay) {
        // On vérifie que tous les exercices du jour précédent sont validés
        const previousDay = currentUserProgram.currentDay;
        // Récupérer les exercices du jour précédent
        const { data: joursData, error: joursError } = await supabase
          .from('jours')
          .select('exercices(id, valeur_cible)')
          .eq('programme_id', currentProgram.id)
          .eq('numero_jour', previousDay)
          .single();
        if (joursError || !joursData) {
          console.error('Erreur ou pas de données pour le jour précédent:', joursError);
          return;
        }
        const exerciceIds = (joursData.exercices || []).map((ex: any) => ex.id);
        let progression: any[] = [];
        if (exerciceIds.length > 0) {
          const { data: progressionData, error: progressionError } = await supabase
            .from('progression_exercice')
            .select('exercice_id, valeur_realisee')
            .eq('user_id', user.id)
            .in('exercice_id', exerciceIds);
          if (progressionError) {
            console.error('Erreur lors de la récupération des progressions:', progressionError);
            return;
          }
          progression = progressionData || [];
        }
        // Vérifier que tous les exercices sont validés
        const allExercisesCompleted = (joursData.exercices || []).every((ex: any) => {
          const prog = progression.find((p: any) => p.exercice_id === ex.id);
          return prog && prog.valeur_realisee >= ex.valeur_cible;
        });
        if (!allExercisesCompleted) {
          console.log('Tous les exercices du jour précédent ne sont pas validés, pas de passage au jour suivant');
          return;
        }
        // --- FIN NOUVEAU ---
        // Si on est sur un nouveau jour ET que tous les exercices sont validés, avancer au jour suivant
        console.log('Nouveau jour détecté, passage au jour suivant');
        const nextDay = currentUserProgram.currentDay + 1;
        const isCompleted = nextDay > currentProgram.duration;
        const newDay = isCompleted ? currentUserProgram.currentDay : nextDay;
        setUserPrograms([{
          ...currentUserProgram,
          currentDay: newDay,
          completed: isCompleted,
          lastUpdated: new Date()
        }]);
        const programId = currentProgram.id;
        const updateData = {
          progress: { 
            currentDay: newDay,
            lastUpdated: new Date().toISOString(),
            completedDate: isCompleted ? new Date().toISOString() : null,
            totalCompletedDays: isCompleted ? (currentProgram.duration || 0) : currentUserProgram.currentDay
          },
          programme_id: programId
        };
        console.log('Avancement automatique au jour suivant:', updateData);
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
        if (updateError) {
          console.error('Erreur lors de la mise à jour automatique de la progression:', updateError);
        } else {
          console.log('Progression mise à jour, jour suivant chargé:', newDay);
          if (!isCompleted) {
            setCurrentRitual(null);
            getCurrentDayRitual();
          } else {
            console.log('Programme terminé, pas de chargement d\'un nouveau jour');
          }
        }
      } else {
        console.log('Toujours le même jour, pas de changement de jour');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de changement de jour:', error);
    }
  };

  // Charger les données au démarrage de l'application
  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand l'utilisateur change
  useEffect(() => {
    if (user) {
      console.log("Rechargement des données après changement d'utilisateur", user.id);
      loadData();
    }
  }, [user?.id]);

  // Vérifier si un nouveau jour a commencé lors du chargement
  useEffect(() => {
    if (currentProgram && userPrograms.length > 0 && user) {
      checkAndAdvanceDay();
    }
  }, [currentProgram, userPrograms.length, user?.id]);

  const selectProgram = async (programId: string) => {
    try {
      setIsLoading(true);
      
      // Toujours utiliser un ID sous forme de chaîne de caractères
      const programIdString = String(programId);
      console.log('Programme ID à mettre à jour (normalisé):', programIdString);
      
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        console.error('Impossible de sélectionner le programme: Utilisateur non connecté');
        throw new Error('Utilisateur non connecté');
      }
      
      // Vérifier si le programme existe
      const program = programs.find(p => String(p.id) === programIdString);
      if (!program) {
        console.error('Programme non trouvé:', programIdString);
        throw new Error('Programme non trouvé');
      }
      console.log('Programme trouvé:', program.title, 'ID:', program.id);
      
      // Date actuelle pour la mise à jour
      const now = new Date();
      const nowISOString = now.toISOString();
      
      // Création d'un objet progress pour la mise à jour
      const progressData = {
        currentDay: 1,
        lastUpdated: nowISOString,
        completedDate: null,
        totalCompletedDays: 0
      };
      
      // Effacer toutes les progressions d'exercices de l'utilisateur
      console.log('Suppression de toutes les progressions d\'exercices pour l\'utilisateur:', user.id);
      const { error: deleteProgressError } = await supabase
        .from('progression_exercice')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteProgressError) {
        console.error('Erreur lors de la suppression des progressions d\'exercices:', deleteProgressError);
        // Continuer malgré l'erreur
      } else {
        console.log('Toutes les progressions d\'exercices ont été supprimées avec succès');
      }
      
      // Mise à jour complète avec programme_id ET progress
      console.log('Mise à jour du profil avec programme_id et progress');
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          programme_id: programIdString,
          progress: progressData
        })
        .eq('id', user.id)
        .select();
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour du profil:', updateError);
        throw updateError;
      }
      
      console.log('Mise à jour réussie:', updateData);
      
      // Vérifier que la mise à jour a bien fonctionné
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (verifyError) {
        console.error('Erreur lors de la vérification du profil:', verifyError);
      } else {
        console.log('Profil après mise à jour:', verifyProfile);
        console.log('Vérification programme_id:', verifyProfile.programme_id);
        console.log('Vérification progress:', verifyProfile.progress);
      }
      
      // Mettre à jour le currentProgram localement
      setCurrentProgram(program);
      
      // Initialiser userPrograms avec le nouveau programme
      const userProgram = {
        programId: program.id,
        startDate: now,
          currentDay: 1,
          completed: false,
        lastUpdated: now
      };
      
      console.log('Mise à jour de userPrograms avec:', userProgram);
      setUserPrograms([userProgram]);
      
      // Vider le rituel courant pour forcer un rechargement
      setCurrentRitual(null);
      
      return program;
    } catch (error) {
      console.error('Failed to select program:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDayRitual = async (): Promise<DailyRitual | null> => {
    if (!currentProgram) return null;
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;
    const userProgram = userPrograms.find(up => up.programId === currentProgram.id);
    if (!userProgram) return null;
    
    console.log('Récupération du rituel pour le jour:', userProgram.currentDay);

    // Vérifier si le jour demandé dépasse la durée du programme
    if (userProgram.currentDay > currentProgram.duration) {
      console.log('Le jour demandé dépasse la durée du programme');
      return null;
    }

    // Récupérer une citation aléatoire pour le jour
    const dailyQuote = await getRandomQuote();

    // Récupérer le jour courant dans la table jours
    const { data: joursData, error: joursError } = await supabase
      .from('jours')
      .select(`
        *,
        exercices (
          id,
          nom,
          description,
          image_url,
          valeur_cible,
          video_url,
          ordre
        )
      `)
      .eq('programme_id', currentProgram.id)
      .eq('numero_jour', userProgram.currentDay)
      .single();

    console.log('Données du jour:', joursData, 'Erreur:', joursError);

    if (joursError || !joursData) {
      console.error('Erreur ou pas de données pour le jour:', joursError);
      
      // Si nous avons un rituel courant, on le conserve au lieu de retourner null
      // Cela évitera que l'écran affiche "Programme terminé" à tort
      if (currentRitual && currentRitual.day === userProgram.currentDay) {
        console.log('Conservation du rituel courant pour éviter une interruption');
        return currentRitual;
      }
      
      return null;
    }

    // Récupérer la progression pour chaque exercice du jour
    const exerciceIds = (joursData.exercices || []).map((ex: any) => ex.id);
    console.log('IDs des exercices à récupérer:', exerciceIds);
    
    let progression: any[] = [];
    if (exerciceIds.length > 0) {
      const { data: progressionData, error: progressionError } = await supabase
        .from('progression_exercice')
        .select('exercice_id, valeur_realisee')
        .eq('user_id', user.id)
        .in('exercice_id', exerciceIds);
      
      if (progressionError) {
        console.error('Erreur lors de la récupération des progressions:', progressionError);
      }
      
      progression = progressionData || [];
      console.log('Progression des exercices récupérée:', progression);
      
      // Vérifier si tous les exercices ont une progression
      const exercicesAvecProgression = progression.map(p => p.exercice_id);
      const exercicesSansProgression = exerciceIds.filter((id: string) => !exercicesAvecProgression.includes(id));
      
      if (exercicesSansProgression.length > 0) {
        console.log('Exercices sans progression:', exercicesSansProgression);
        
        // Initialiser les progressions manquantes à 0
        try {
          const initialProgressions = exercicesSansProgression.map((id: string) => ({
            user_id: user.id,
            exercice_id: id,
            valeur_realisee: 0
          }));
          
          console.log('Création des progressions initiales:', initialProgressions);
          
          const { data: insertResult, error: insertError } = await supabase
            .from('progression_exercice')
            .insert(initialProgressions)
            .select();
            
          if (insertError) {
            console.error('Erreur lors de l\'initialisation des progressions:', insertError);
          } else {
            console.log('Progressions initialisées avec succès:', insertResult);
            
            // Ajouter les nouvelles progressions à notre tableau local
            progression = [...progression, ...insertResult];
          }
        } catch (error) {
          console.error('Erreur globale lors de l\'initialisation des progressions:', error);
        }
      }
    }

    // Trier et formater les exercices
    const exercicesTries = (joursData.exercices || [])
      .sort((a: any, b: any) => (a.ordre || 0) - (b.ordre || 0))
      .map((ex: any) => {
        const prog = progression.find(p => p.exercice_id === ex.id);
        console.log('Exercice:', ex.nom, 'ID:', ex.id, 'Progression trouvée:', prog);
        
        const formattedExercise = {
          id: ex.id,
          name: ex.nom,
          description: ex.description,
          imageUrl: ex.image_url,
          videoUrl: ex.video_url || null,
          targetReps: ex.valeur_cible,
          completedReps: prog?.valeur_realisee || 0,
          order: ex.ordre || 0
        };
        return formattedExercise;
      });

    // Citation par défaut au cas où il n'y en aurait pas dans la base de données
    const defaultQuote = "Commence chaque journée, comme si elle avait écrite pour toi !";

    const ritual = {
      id: joursData.id,
      programId: currentProgram.id,
      day: userProgram.currentDay,
      quote: dailyQuote || joursData.quote || defaultQuote,
      exercises: exercicesTries,
      isCompleted: false
    };

    setCurrentRitual(ritual);
    return ritual;
  };

  // Fonction pour récupérer une citation aléatoire
  const getRandomQuote = async (): Promise<string | null> => {
    try {
      // Récupérer toutes les citations
      const { data, error } = await supabase
        .from('quotes')
        .select('citation');
      
      if (error || !data || data.length === 0) {
        console.error('Erreur lors de la récupération des citations:', error);
        return null;
      }

      console.log(`Nombre total de citations: ${data.length}`);
      
      // Générer un index aléatoire
      const randomIndex = Math.floor(Math.random() * data.length);
      
      // Récupérer la citation aléatoire
      const randomQuote = data[randomIndex].citation;
      console.log('Citation aléatoire récupérée:', randomQuote);
      
      return randomQuote;
    } catch (error) {
      console.error('Erreur lors de la récupération d\'une citation aléatoire:', error);
      return null;
    }
  };

  const updateExerciseProgress = async (exerciseId: string, reps: number) => {
    try {
      console.log('Début updateExerciseProgress:', { exerciseId, reps });
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        console.log('Pas d\'utilisateur connecté');
        return;
      }
      console.log('Utilisateur connecté:', user.id);

      // Mettre à jour l'état local immédiatement pour une meilleure réactivité
      if (currentRitual) {
        console.log('État actuel du rituel:', currentRitual);
        const updatedExercises = currentRitual.exercises.map(ex => {
          if (ex.id === exerciseId) {
            const newReps = ex.completedReps + reps;
            console.log('Mise à jour exercice:', {
              id: ex.id,
              oldReps: ex.completedReps,
              addedReps: reps,
              newReps
            });
            return { ...ex, completedReps: newReps };
          }
          return ex;
        });
        console.log('Exercices mis à jour:', updatedExercises);
        setCurrentRitual({
          ...currentRitual,
          exercises: updatedExercises
        });
      } else {
        console.log('Pas de rituel courant');
      }

      // Récupérer la progression actuelle
      const { data: currentProgressArray, error: progressError } = await supabase
        .from('progression_exercice')
        .select('id, valeur_realisee')
        .eq('user_id', user.id)
        .eq('exercice_id', exerciseId);

      if (progressError) {
        console.error('Erreur lors de la récupération de la progression actuelle:', progressError);
      }

      console.log('Progressions trouvées:', currentProgressArray);
      
      // Prendre la valeur la plus élevée si plusieurs entrées existent
      let currentValue = 0;
      let progressionId: string | null = null;
      
      if (currentProgressArray && currentProgressArray.length > 0) {
        // Trouver l'entrée avec la valeur la plus élevée
        const highestProgress = currentProgressArray.reduce((prev, current) => 
          (current.valeur_realisee > prev.valeur_realisee) ? current : prev
        );
        
        currentValue = highestProgress.valeur_realisee;
        progressionId = highestProgress.id;
        
        // Si plusieurs entrées existent, les supprimer sauf la plus élevée
        if (currentProgressArray.length > 1) {
          console.log('Plusieurs entrées trouvées, nettoyage nécessaire');
          
          // IDs à supprimer (tous sauf celui avec la valeur la plus élevée)
          const idsToDelete = currentProgressArray
            .filter(p => p.id !== progressionId)
            .map(p => p.id);
            
          if (idsToDelete.length > 0) {
            console.log('Suppression des entrées dupliquées:', idsToDelete);
            const { error: deleteError } = await supabase
              .from('progression_exercice')
              .delete()
              .in('id', idsToDelete);
              
            if (deleteError) {
              console.error('Erreur lors de la suppression des doublons:', deleteError);
            }
          }
        }
      }
      
      const newValue = currentValue + reps;
      console.log('Valeur actuelle:', currentValue, 'Nouvelle valeur à sauvegarder:', newValue);

      // S'assurer que nous avons un UUID valide pour user_id et exercice_id
      if (!user.id || !exerciseId) {
        console.error('ID utilisateur ou exercice invalide:', { userId: user.id, exerciseId });
        return;
      }

      // Enregistrer avec un upsert explicite
      const upsertData: {
        user_id: string;
        exercice_id: string;
        valeur_realisee: number;
        id?: string;
      } = {
        user_id: user.id,
        exercice_id: exerciseId,
        valeur_realisee: newValue
      };
      
      // Si on a un ID existant, l'inclure pour l'upsert
      if (progressionId) {
        upsertData.id = progressionId;
      }
      
      console.log('Données à sauvegarder:', upsertData);

      // Upsert la progression
      const { data, error } = await supabase
        .from('progression_exercice')
        .upsert(upsertData)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour de la progression:', error);
        // Essayer une approche alternative en cas d'échec
        console.log('Tentative alternative avec insert/update séparés');
        
        // Vérifier si l'entrée existe
        const { count, error: countError } = await supabase
          .from('progression_exercice')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('exercice_id', exerciseId);
          
        if (countError) {
          console.error('Erreur lors de la vérification de l\'existence de la progression:', countError);
          return;
        }
        
        if (count && count > 0) {
          // Update si existe
          const { data: updateData, error: updateError } = await supabase
            .from('progression_exercice')
            .update({ valeur_realisee: newValue })
            .eq('user_id', user.id)
            .eq('exercice_id', exerciseId)
            .select();
            
          console.log('Résultat update:', updateData, 'Erreur:', updateError);
        } else {
          // Insert si n'existe pas
          const { data: insertData, error: insertError } = await supabase
            .from('progression_exercice')
            .insert(upsertData)
            .select();
            
          console.log('Résultat insert:', insertData, 'Erreur:', insertError);
        }
      } else {
        console.log('Progression sauvegardée avec succès:', data);
      }
      
      // NOUVELLE PARTIE: Mettre à jour les statistiques dans le profil
      await updateExerciseStats(user.id, exerciseId, reps);
      
    } catch (error) {
      console.error('Erreur générale lors de la mise à jour de la progression:', error);
      getCurrentDayRitual();
    }
  };

  const completeDay = async () => {
    try {
      if (!currentProgram || !userPrograms.length) {
        console.warn('Impossible de compléter le jour: pas de programme actif ou pas de progression utilisateur');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        console.warn('Impossible de compléter le jour: utilisateur non connecté');
        return;
      }
      
      // Vérifier que tous les exercices ont été complétés
      if (currentRitual) {
        const allExercisesCompleted = currentRitual.exercises.every(
          exercise => exercise.completedReps >= exercise.targetReps
        );
        
        if (!allExercisesCompleted) {
          console.warn('Certains exercices ne sont pas complétés. Jour non validé.');
          // On pourrait aussi retourner un message pour l'utilisateur ici
          return false;
        }
        
        console.log('Tous les exercices du jour sont complétés. Validation du jour...');
      }
      
      // Récupérer d'abord le profil pour avoir les données actuelles
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }
      
      console.log('Profil actuel avant mise à jour:', currentProfile);
      
      // Trouver le programme utilisateur actuel
      const currentUserProgram = userPrograms[0];
      
      // MODIFICATION: Ne pas incrémenter le jour automatiquement
      // On met simplement à jour le flag isCompleted dans le state local
      // pour indiquer que le jour est terminé
      const isCurrentDayCompleted = true;
      
      // Marquer ce jour comme complété dans les statistiques 
      // et mettre à jour les jours consécutifs et le total de jours
      try {
        console.log('Marquage du jour comme complété dans les statistiques');
        if (!currentProfile.clan_id) {
          console.warn('Aucun clan_id trouvé pour l\'utilisateur, utilisation d\'un ID par défaut');
        }
        
        const result = await markDayAsCompleted(user.id, currentProfile.clan_id || '00000000-0000-0000-0000-000000000000');
        if (result) {
          console.log('Jour marqué comme complété avec succès dans les statistiques');
          
          // IMPORTANT: Ne pas modifier currentRitual ici
          // Laisser l'utilisateur voir les exercices complétés jusqu'à minuit
        } else {
          console.warn('Échec lors du marquage du jour comme complété dans les statistiques');
        }
      } catch (statsError) {
        console.error('Erreur lors du marquage du jour dans les statistiques:', statsError);
      }
      
      return isCurrentDayCompleted;
    } catch (error) {
      console.error('Erreur lors de la complétion du jour:', error);
    }
  };

  // Fonction désactivée temporairement en attendant de résoudre les problèmes
  /*
  const checkAndUpdateDay = async (userId: string, userProgram: UserProgram, program: Program) => {
    try {
      const now = new Date();
      const lastUpdated = new Date(userProgram.lastUpdated);
      
      // Vérifier si c'est un jour différent (en comparant les dates sans les heures)
      const lastUpdatedDay = new Date(lastUpdated.getFullYear(), lastUpdated.getMonth(), lastUpdated.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (today > lastUpdatedDay) {
        console.log('Un nouveau jour est arrivé, mise à jour de la progression');
        
        // Incrémenter le jour
        const nextDay = userProgram.currentDay + 1;
        
        // Vérifier si on a terminé le programme
        const isCompleted = nextDay > program.duration;
        
        // Calculer le nouveau jour
        const newDay = isCompleted ? userProgram.currentDay : nextDay;
        
        // Mettre à jour l'état local
        setUserPrograms([{
          ...userProgram,
          currentDay: newDay,
          completed: isCompleted,
          lastUpdated: now
        }]);
        
        // Mettre à jour le profil dans la base de données
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            progression: { 
              currentDay: newDay,
              lastUpdated: now.toISOString(),
              completedDate: isCompleted ? now.toISOString() : null
            }
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Erreur lors de la mise à jour automatique de la progression:', updateError);
        } else {
          console.log('Progression mise à jour automatiquement vers le jour', newDay);
          
          // Vider le rituel courant pour forcer un rechargement
          setCurrentRitual(null);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la progression quotidienne:', error);
    }
  };
  */

  return (
    <ProgramContext.Provider
      value={{
        programs,
        currentProgram,
        userPrograms,
        isLoading,
        currentRitual,
        selectProgram,
        getCurrentDayRitual,
        updateExerciseProgress,
        completeDay,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}
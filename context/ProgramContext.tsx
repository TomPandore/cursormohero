import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Program, DailyRitual, UserProgram } from '@/types';
import { supabase } from '@/lib/supabase';

interface ProgramContextProps {
  programs: Program[];
  currentProgram: Program | null;
  userPrograms: UserProgram[];
  isLoading: boolean;
  currentRitual: DailyRitual | null;
  selectProgram: (programId: string) => Promise<Program | void>;
  getCurrentDayRitual: () => Promise<DailyRitual | null>;
  updateExerciseProgress: (exerciseId: string, reps: number) => void;
  completeDay: () => void;
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
  completeDay: () => {},
};

const ProgramContext = createContext<ProgramContextProps>(defaultContext);

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRitual, setCurrentRitual] = useState<DailyRitual | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer l'utilisateur courant
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        let userProgrammeId = null;
        
        if (user) {
          // Récupérer le profil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('programme_id')
            .eq('id', user.id)
            .single();
          console.log('Profil utilisateur:', profile, 'Erreur:', profileError);
          if (!profileError && profile) {
            userProgrammeId = profile.programme_id;
            console.log('programme_id du profil:', userProgrammeId);
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

        if (programsError) throw programsError;
        console.log('Liste des programmes:', programsData);

        // Convert Supabase data to Program type
        const formattedPrograms: Program[] = programsData.map(p => {
          console.log('Programme:', p.nom);
          console.log('Résultats:', p.resultats);
          console.log('Parcours resume:', p.parcours_resume);
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
          const found = formattedPrograms.find(p => p.id === userProgrammeId);
          console.log('Programme courant trouvé:', found);
          setCurrentProgram(found || null);
          
          // Initialiser userPrograms avec le programme actuel
          if (found) {
            setUserPrograms([{
              programId: found.id,
              startDate: new Date(),
              currentDay: 1,
              completed: false
            }]);
          }
        } else {
          setCurrentProgram(null);
          setUserPrograms([]);
        }
      } catch (error) {
        console.error('Failed to load programs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
      console.log('Programme trouvé:', program);
      
      // Mettre à jour le profil en base avec une requête simple
      console.log('Tentative de mise à jour avec:', { id: user.id, programme_id: programIdString });
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ programme_id: programIdString })
        .eq('id', user.id)
        .select()
        .maybeSingle();
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour du profil:', updateError);
        throw updateError;
      }
      
      console.log('Mise à jour réussie:', updateData);
      
      // Mettre à jour le currentProgram localement
      setCurrentProgram(program);
      
      // Initialiser userPrograms avec le nouveau programme
      setUserPrograms([{
        programId: program.id,
        startDate: new Date(),
        currentDay: 1,
        completed: false
      }]);
      
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

    const ritual = {
      id: joursData.id,
      programId: currentProgram.id,
      day: userProgram.currentDay,
      quote: joursData.quote || '',
      exercises: exercicesTries,
      isCompleted: false
    };

    setCurrentRitual(ritual);
    return ritual;
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
    } catch (error) {
      console.error('Erreur générale lors de la mise à jour de la progression:', error);
      getCurrentDayRitual();
    }
  };

  const completeDay = () => {
    // À implémenter plus tard avec la base
  };

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
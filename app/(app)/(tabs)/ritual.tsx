import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ImageBackground,
  Dimensions
} from 'react-native';
import { router, Stack } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import ProgressBar from '@/components/ProgressBar';
import ExerciseCard from '@/components/ExerciseCard';
import Button from '@/components/Button';
import { useProgram } from '@/context/ProgramContext';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown
} from 'react-native-reanimated';
import { DailyRitual, Exercise } from '@/types';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import FallingLeaves from '@/components/FallingLeaves';
import { ExerciseDetails } from '@/components/ExerciseCard';

export default function DailyRitualScreen() {
  const { 
    currentProgram, 
    userPrograms, 
    currentRitual,
    getCurrentDayRitual, 
    updateExerciseProgress,
    completeDay
  } = useProgram();
  
  const { user } = useAuth();
  const { playSound } = useAudio();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dayCompleted, setDayCompleted] = useState(false);
  const pulseValue = useSharedValue(1);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showProgramCompleted, setShowProgramCompleted] = useState(false);
  const [showExerciseDetails, setShowExerciseDetails] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // ID du programme d'initiation qu'il ne faut pas traiter
  const INITIATION_PROGRAM_ID = 'ecc043c9-61ac-429c-8811-530a4896fd04';
  
  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);
  
  useEffect(() => {
    const fetchRitual = async () => {
      console.log('Tentative de récupération du rituel...');
      setIsLoading(true);
      try {
        await getCurrentDayRitual();
      } catch (error) {
        console.error('Erreur lors de la récupération du rituel:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRitual();
  }, [currentProgram, userPrograms]);
  
  // Log pour afficher la structure des exercices reçus
  useEffect(() => {
    if (currentRitual && currentRitual.exercises) {
      console.log('Exercices reçus:', JSON.stringify(currentRitual.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        videoUrl: ex.videoUrl,
        imageUrl: ex.imageUrl
      })), null, 2));
    }
  }, [currentRitual]);
  
  // Effet pour détecter quand tous les exercices sont terminés
  useEffect(() => {
    // Vérifier si tous les exercices sont complétés
    if (currentRitual && !dayCompleted) {
      const allExercisesCompleted = currentRitual.exercises.every(
        exercise => exercise.completedReps >= exercise.targetReps
      );
      
      // Si tous les exercices sont complétés, marquer le jour comme terminé dans les statistiques
      // mais sans passer au jour suivant
      if (allExercisesCompleted) {
        console.log('Tous les exercices sont complétés, marquage du jour comme terminé...');
        const markDayAsCompleted = async () => {
          try {
            // Éviter de rappeler completeDay si le jour est déjà marqué comme complété
            // dans l'état local, même si tous les exercices sont terminés
            if (dayCompleted) {
              console.log('Jour déjà marqué comme complété, pas besoin de rappeler completeDay');
              return;
            }
            
            const result = await completeDay();
            if (result) {
              setDayCompleted(true);
              console.log('Jour marqué comme terminé avec succès dans les statistiques');
            }
          } catch (error) {
            console.error('Erreur lors du marquage du jour comme terminé:', error);
          }
        };
        
        markDayAsCompleted();
      }
    }
  }, [currentRitual?.exercises, dayCompleted]);
  
  // Réinitialiser dayCompleted lorsque le rituel change (changement de jour)
  useEffect(() => {
    if (currentRitual?.id) {
      // Vérifier si tous les exercices sont déjà complétés
      const allExercisesCompleted = currentRitual.exercises.every(
        exercise => exercise.completedReps >= exercise.targetReps
      );
      
      setDayCompleted(allExercisesCompleted);
    } else {
      setDayCompleted(false);
    }
  }, [currentRitual?.id]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });
  
  // Animation et son pour l'écran Bamayé 
  useEffect(() => {
    if (showCongratulations) {
      // Jouer le son via le contexte audio
      playSound(require('@/assets/music/bamayedrum.mp3'));
      
      // Animation
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [showCongratulations]);

  // Déplacer la déclaration de isRitualComplete avant son utilisation dans l'effet
  const isRitualComplete = () => {
    if (!currentRitual) return false;
    return currentRitual.exercises.every(ex => ex.completedReps >= ex.targetReps);
  };

  // Modifier l'effet pour détecter quand tous les exercices sont terminés et afficher l'écran Bamayé
  useEffect(() => {
    if (currentRitual && isRitualComplete() && !showCongratulations && !dayCompleted) {
      setShowCongratulations(true);
    }
  }, [currentRitual, isRitualComplete, dayCompleted]);

  // Fonction pour fermer l'écran Bamayé
  const handleCloseCongratulations = () => {
    setShowCongratulations(false);
  };
  
  // Vérifier si le programme est réellement terminé (jour actuel > durée totale)
  const userProgram = userPrograms.find(up => up.programId === currentProgram?.id);
  const isProgramCompleted = userProgram && currentProgram && userProgram.currentDay > currentProgram.duration;
  const isInitiationProgram = currentProgram?.id === INITIATION_PROGRAM_ID;
  
  // Afficher l'écran de fin de programme pour les programmes normaux
  if (isProgramCompleted && !isInitiationProgram) {
    if (!showProgramCompleted) {
      setShowProgramCompleted(true);
    }
  }

  // Effet pour jouer le son de fin de programme
  useEffect(() => {
    if (showProgramCompleted) {
      // Jouer le son via le contexte audio
      playSound(require('@/assets/music/fin_programme.mp3'));
    }
  }, [showProgramCompleted]);

  // Fonction pour fermer l'écran de fin de programme
  const handleCloseProgramCompleted = () => {
    setShowProgramCompleted(false);
    // Rediriger vers la sélection de programmes
    router.push('/(app)/(tabs)/voies');
  };
  
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Chargement du rituel...</Text>
      </View>
    );
  }
  
  if (!currentProgram) {
    return (
      <View style={styles.noProgramContainer}>
        <View style={styles.mentorWrapper}>
          <Image 
            source={require('@/assets/mentor-mohero.png')} 
            style={styles.mentorImageLarge}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.mentorMessage}>
          Tu n'as pour le moment commencé aucun chemin
        </Text>
        <Button
          title="Découvrir les programmes"
          onPress={() => router.push('/(app)/(tabs)/voies')}
          style={styles.emptyButton}
        />
      </View>
    );
  }
  
  // Si currentRitual est null mais que le programme n'est pas terminé, 
  // on affiche un message différent et on essaie de recharger le rituel
  if (!currentRitual) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Rituel non disponible</Text>
        <Text style={styles.emptyText}>
          Le rituel du jour n'est pas disponible pour le moment.
          Vérifie que tu as bien terminé les exercices précédents.
        </Text>
        <Button
          title="Actualiser"
          onPress={() => getCurrentDayRitual()}
          style={styles.emptyButton}
        />
      </View>
    );
  }
  
  const dayProgress = userProgram ? `JOUR ${userProgram.currentDay} / ${currentProgram.duration}` : '';
  
  const calculateDailyProgress = () => {
    if (!currentRitual) return 0;
    const totalReps = currentRitual.exercises.reduce((acc: number, ex: Exercise) => acc + ex.targetReps, 0);
    const completedReps = currentRitual.exercises.reduce((acc: number, ex: Exercise) => acc + Math.min(ex.completedReps, ex.targetReps), 0);
    // Limiter à 1 (100%) maximum
    return Math.min(totalReps > 0 ? completedReps / totalReps : 0, 1);
  };
  
  // Message dynamique du mentor en fonction de l'état des rituels
  const getMentorMessage = () => {
    if (isRitualComplete()) {
      return ["Félicitations !", " Tu as terminé tous les rituels du jour. Reviens demain pour la suite."];
    } else {
      return currentRitual?.quote || "Commence chaque journée, comme si elle avait été écrite pour toi !";
    }
  };
  
  // Affichage de l'écran Bamayé si showCongratulations est true
  if (showCongratulations) {
    return (
      <>
        <ImageBackground
          source={require('@/assets/bamaye.webp')}
          style={styles.bamayeBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            style={styles.bamayeGradient}
          >
            <FallingLeaves />
            <View style={styles.bamayeContentContainer}>
              <Animated.View style={[animatedStyle, styles.bamayeIconContainer]}>
                <Text style={styles.bamayeIcon}>🔥</Text>
              </Animated.View>
              <Text style={styles.bamayeTitle}>BAMAYÉ !</Text>
              <Text style={styles.bamayeMessage}>
                Tu as terminé tous tes rituels du jour, reviens demain pour continuer à progresser !
              </Text>
              <Button
                title="Terminer"
                onPress={handleCloseCongratulations}
                style={styles.bamayeButton}
                fullWidth
              />
            </View>
          </LinearGradient>
        </ImageBackground>
      </>
    );
  }
  
  // Affichage de l'écran de fin de programme si showProgramCompleted est true
  if (showProgramCompleted) {
    return (
      <>
        <ImageBackground
          source={require('@/assets/fin_programme.webp')}
          style={styles.bamayeBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            style={styles.bamayeGradient}
          >
            <FallingLeaves />
            <View style={styles.bamayeContentContainer}>
              <Animated.View style={[animatedStyle, styles.bamayeIconContainer]}>
                <Text style={styles.bamayeIcon}>🏆</Text>
              </Animated.View>
              <Text style={styles.bamayeTitle}>PROGRAMME TERMINÉ !</Text>
              <Text style={styles.bamayeMessage}>
                Félicitations ! Tu as terminé {currentProgram?.title}. 
                {'\n'}Tu es maintenant prêt pour un nouveau défi !
              </Text>
              <Button
                title="Choisir un nouveau programme"
                onPress={handleCloseProgramCompleted}
                style={styles.bamayeButton}
                fullWidth
              />
            </View>
          </LinearGradient>
        </ImageBackground>
      </>
    );
  }
  
  // Pour le programme d'initiation, afficher l'ancien écran simple
  if (isProgramCompleted && isInitiationProgram) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Programme terminé !</Text>
        <Text style={styles.emptyText}>
          Félicitations pour avoir complété ce programme.
          Choisissez-en un nouveau pour continuer votre progression.
        </Text>
        <Button
          title="Choisir un nouveau programme"
          onPress={() => router.push('/(app)/(tabs)/voies')}
          style={styles.emptyButton}
        />
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <ImageBackground 
          source={currentProgram.imageUrl ? { uri: currentProgram.imageUrl } : require('@/assets/slide1.webp')}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <Text style={styles.programTitle}>{currentProgram.title}</Text>
        <Text style={styles.dayProgress}>{dayProgress}</Text>
      </View>
          </View>
        </ImageBackground>
      
        <View style={styles.mainContent}>
      <Animated.View 
        style={[
          styles.quoteContainer, 
          animatedStyle, 
          isRitualComplete() && styles.completedQuoteContainer
        ]}
      >
        <View style={styles.quoteContent}>
          <Image 
            source={require('@/assets/mentor-mohero.png')} 
            style={[
              styles.mentorImage,
              isRitualComplete() && styles.completedMentorImage
            ]}
            resizeMode="contain"
          />
          <View style={styles.quoteTextContainer}>
            {isRitualComplete() ? (
              <>
                <Text style={styles.quote}>
                  <Text style={styles.completedQuote}>{getMentorMessage()[0]}</Text>
                  <Text>{getMentorMessage()[1]}</Text>
                </Text>
                <Text style={styles.nextDayInfo}>
                  Le jour suivant sera disponible à partir de minuit.
                </Text>
              </>
            ) : (
              <Text style={styles.quote}>"{getMentorMessage()}"</Text>
            )}
          </View>
        </View>
      </Animated.View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progression du jour</Text>
        <ProgressBar 
          progress={calculateDailyProgress()} 
          height={20} 
          showPercentage 
          percentagePosition="inside"
        />
      </View>
      
      <Text style={styles.exercisesTitle}>RITUELS DU JOUR</Text>
      
      {currentRitual.exercises && currentRitual.exercises.length > 0 ? (
        currentRitual.exercises
          .slice()
          .sort((a, b) => {
            const aCompleted = a.completedReps >= a.targetReps;
            const bCompleted = b.completedReps >= b.targetReps;
                if (aCompleted === bCompleted) return 0;
            return aCompleted ? 1 : -1;
          })
          .map((exercise: Exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onUpdateProgress={updateExerciseProgress}
                  onPressDetails={() => setSelectedExercise(exercise)}
        />
          ))
      ) : (
        <Text style={styles.noExercisesText}>Aucun exercice disponible pour aujourd'hui</Text>
      )}
        </View>
    </ScrollView>
    
    {/* Modale pour les détails de l'exercice */}
    {selectedExercise && (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.background,
        elevation: 999999,
        zIndex: 999999
      }}>
        <ExerciseDetails 
          exercise={selectedExercise} 
          onClose={() => setSelectedExercise(null)} 
        />
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  headerBackground: {
    height: 220,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  programTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  dayProgress: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  mainContent: {
    padding: SPACING.lg,
  },
  noProgramContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  mentorWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  mentorImageLarge: {
    width: '100%',
    height: '100%',
  },
  mentorMessage: {
    ...FONTS.heading,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontSize: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    minWidth: 240,
  },
  quoteContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  completedQuoteContainer: {
    backgroundColor: COLORS.card,
    borderWidth: 0,
  },
  quoteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorImage: {
    width: 80,
    height: 80,
    marginRight: SPACING.md,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  completedMentorImage: {
    borderColor: COLORS.success,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quote: {
    ...FONTS.body,
    color: COLORS.text,
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
  },
  completedQuote: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: SPACING.xl,
  },
  progressTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  exercisesTitle: {
    ...FONTS.subheading,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  nextDayInfo: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    fontSize: 12,
  },
  noExercisesText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  bamayeBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bamayeGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bamayeContentContainer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xl * 3,
    alignItems: 'center',
  },
  bamayeIconContainer: {
    marginBottom: SPACING.lg,
  },
  bamayeIcon: {
    fontSize: 48,
  },
  bamayeTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 28,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  bamayeMessage: {
    ...FONTS.body,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  bamayeButton: {
    minWidth: 200,
  },
});
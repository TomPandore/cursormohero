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
import ExerciseCard, { ExerciseDetails } from '@/components/ExerciseCard';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIATION_PROGRAM_ID = 'ecc043c9-61ac-429c-8811-530a4896fd04';

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function InitiationRitualScreen() {
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
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Animations
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const flameOpacity = useSharedValue(0.5);
  const flameScale = useSharedValue(1);

  useEffect(() => {
    const fetchRitual = async () => {
      console.log('Récupération du rituel d\'initiation...');
      setIsLoading(true);
      try {
        await getCurrentDayRitual();
      } catch (error) {
        console.error('Erreur lors de la récupération du rituel d\'initiation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Vérifier qu'on est bien sur le programme d'initiation
    if (currentProgram && currentProgram.id !== INITIATION_PROGRAM_ID) {
      console.log('Utilisateur non sur le programme d\'initiation, redirection...');
      router.replace('/(app)/(tabs)/ritual');
      return;
    }
    
    fetchRitual();
  }, [currentProgram, userPrograms]);
  
  // Réinitialiser dayCompleted lorsque le rituel change
  useEffect(() => {
    if (currentRitual?.id) {
      const allExercisesCompleted = currentRitual.exercises.every(
        exercise => exercise.completedReps >= exercise.targetReps
      );
      
      // Si tous les exercices sont complétés et qu'on n'a pas encore marqué le jour comme terminé
      if (allExercisesCompleted && !dayCompleted) {
        const markDayAsCompleted = async () => {
          try {
            const result = await completeDay();
            
            if (result) {
              setDayCompleted(true);
              setShowCongratulations(true);
            }
          } catch (error) {
            console.error('Erreur lors de l\'appel à completeDay():', error);
          }
        };
        
        markDayAsCompleted();
      } else if (allExercisesCompleted && !showCongratulations) {
        // Si le jour est déjà marqué comme complété mais qu'on n'a pas encore montré les félicitations
        setShowCongratulations(true);
      } else if (!allExercisesCompleted) {
        // Si tous les exercices ne sont pas complétés, s'assurer que dayCompleted est false
        setDayCompleted(false);
      }
    } else {
      setDayCompleted(false);
    }
  }, [currentRitual?.id, currentRitual?.exercises, dayCompleted]);
  
  useEffect(() => {
    if (showCongratulations) {
      // Animation de la flamme
      flameOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 2000 }),
          withTiming(0.5, { duration: 2000 })
        ),
        -1,
        true
      );

      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );

      // Animation du titre
      titleOpacity.value = withDelay(
        500,
        withTiming(1, { duration: 1000 })
      );
      titleScale.value = withDelay(
        500,
        withTiming(1, { duration: 1000, easing: Easing.elastic(1) })
      );

      // Animation du texte
      textOpacity.value = withDelay(
        2000,
        withTiming(1, { duration: 1000 })
      );

      // Animation du bouton
      buttonOpacity.value = withDelay(
        4000,
        withTiming(1, { duration: 1000 })
      );

      // Jouer le son
      playSound(require('@/assets/music/welcome.mp3'));
    }
  }, [showCongratulations]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Chargement du rituel d'initiation...</Text>
        </View>
      </>
    );
  }
  
  if (!currentProgram || currentProgram.id !== INITIATION_PROGRAM_ID) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Programme d'initiation non trouvé</Text>
          <Button
            title="Retour"
            onPress={() => router.back()}
            style={styles.emptyButton}
          />
        </View>
      </>
    );
  }
  
  if (!currentRitual) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Rituel d'initiation non disponible</Text>
          <Text style={styles.emptyText}>
            Le rituel d'initiation n'est pas disponible pour le moment.
          </Text>
          <Button
            title="Actualiser"
            onPress={() => getCurrentDayRitual()}
            style={styles.emptyButton}
          />
        </View>
      </>
    );
  }
  
  const userProgram = userPrograms.find(up => up.programId === currentProgram.id);
  const dayProgress = userProgram ? `JOUR ${userProgram.currentDay} / ${currentProgram.duration}` : '';
  
  const calculateDailyProgress = () => {
    if (!currentRitual) return 0;
    const totalReps = currentRitual.exercises.reduce((acc: number, ex: Exercise) => acc + ex.targetReps, 0);
    const completedReps = currentRitual.exercises.reduce((acc: number, ex: Exercise) => acc + Math.min(ex.completedReps, ex.targetReps), 0);
    return Math.min(totalReps > 0 ? completedReps / totalReps : 0, 1);
  };
  

  

  
  const handleJoinTribe = async () => {
    try {
      // Marquer l'initiation comme terminée dans le profil
      if (user && user.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ initiation_completed: true })
          .eq('id', user.id);

        if (error) {
          console.error('Erreur lors de la mise à jour du statut d\'initiation:', error);
        }
      }
      
      // Rediriger vers le choix de clan
      router.replace('/(auth)/onboarding/clan');
    } catch (error) {
      console.error('Erreur lors de la transition vers le choix de clan:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    }
  };
  
  // Écran de félicitations après completion du premier jour
  if (showCongratulations && dayCompleted) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.congratsContainer}>
          <ImageBackground
            source={require('@/assets/welcome-mohero.webp')}
            style={styles.congratsBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
              style={styles.gradient}
            >
              <AnimatedView 
                style={[
                  styles.flameContainer,
                  {
                    opacity: flameOpacity,
                    transform: [{ scale: flameScale }]
                  }
                ]}
              >
                <Text style={styles.flameText}>🔥</Text>
              </AnimatedView>

              <AnimatedView
                style={[
                  styles.titleContainer,
                  {
                    opacity: titleOpacity,
                    transform: [{ scale: titleScale }]
                  }
                ]}
              >
                <Text style={styles.congratsTitle}>BAMAYÉ !</Text>
              </AnimatedView>

              <AnimatedView
                style={[
                  styles.textContainer,
                  { opacity: textOpacity }
                ]}
              >
                <Text style={styles.congratsSubtitle}>
                  La tribu MoHero est honorée de t'accueillir.
                </Text>
                <Text style={styles.congratsText}>
                À présent, pour faire partie des bâtisseurs de la tribu, il est temps de choisir ton clan.
                </Text>
              </AnimatedView>

              <AnimatedView
                style={[
                  styles.buttonContainer,
                  { opacity: buttonOpacity }
                ]}
              >
                <Button
                  title="Choisir mon clan"
                  onPress={handleJoinTribe}
                  style={styles.clanButton}
                  fullWidth
                />
              </AnimatedView>
            </LinearGradient>
          </ImageBackground>
        </View>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ImageBackground 
          source={{ uri: currentProgram.imageUrl }}
          style={styles.headerBackground}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <Text style={styles.programTitle}>{currentProgram.title}</Text>
              <Text style={styles.dayProgress}>{dayProgress}</Text>
              <Text style={styles.initiationLabel}>Rite d'initiation</Text>
            </View>
          </View>
        </ImageBackground>
        
        <View style={styles.contentContainer}>
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Progression du jour</Text>
            <ProgressBar 
              progress={calculateDailyProgress()} 
            />
          </View>
          
          <View style={styles.quoteSection}>
            <View style={styles.quoteContent}>
              <Image 
                source={require('@/assets/mentor-mohero.png')} 
                style={styles.mentorImage}
                resizeMode="contain"
              />
              <View style={styles.quoteTextContainer}>
                <Text style={styles.quote}>"{currentRitual.quote}"</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>Tes rituels d'initiation</Text>
            <View style={styles.exercisesContainer}>
              {currentRitual.exercises.map((exercise: Exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onUpdateProgress={updateExerciseProgress}
                  onPressDetails={() => setSelectedExercise(exercise)}
                />
              ))}
            </View>
          </View>
          

        </View>
      </ScrollView>
      {selectedExercise && (
        <ExerciseDetails
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    minWidth: 150,
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
    marginBottom: SPACING.xs,
  },
  initiationLabel: {
    ...FONTS.body,
    color: COLORS.primary,
    fontSize: 16,
    fontStyle: 'italic',
  },
  contentContainer: {
    padding: SPACING.lg,
    flex: 1,
  },
  progressSection: {
    marginBottom: SPACING.xl,
  },
  progressLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    marginBottom: SPACING.sm,
  },
  quoteSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
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
  exercisesSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 20,
    marginBottom: SPACING.lg,
  },
  actionContainer: {
    marginTop: SPACING.lg,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
  },
  completedButton: {
    backgroundColor: COLORS.success,
  },
  incompleteContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  incompleteText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  congratsContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  congratsBackground: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: 64,
  },
  flameContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  flameText: {
    fontSize: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  congratsTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 48,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 165, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  congratsSubtitle: {
    ...FONTS.heading,
    color: COLORS.primary,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  congratsText: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 0,
  },
  clanButton: {
    backgroundColor: COLORS.primary,
  },
  exercisesContainer: {
    position: 'relative',
    zIndex: 1,
  },
}); 
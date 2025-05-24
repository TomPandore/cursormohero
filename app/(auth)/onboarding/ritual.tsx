import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ImageBackground
} from 'react-native';
import { router, Stack } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import ProgressBar from '@/components/ProgressBar';
import ExerciseCard from '@/components/ExerciseCard';
import Button from '@/components/Button';
import { useProgram } from '@/context/ProgramContext';
import { useAuth } from '@/context/AuthContext';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { DailyRitual, Exercise } from '@/types';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const INITIATION_PROGRAM_ID = 'ecc043c9-61ac-429c-8811-530a4896fd04';

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
  const [isLoading, setIsLoading] = useState(true);
  const [dayCompleted, setDayCompleted] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const pulseValue = useSharedValue(1);
  
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
      
      setDayCompleted(allExercisesCompleted);
      
      // Si tous les exercices sont complétés et qu'on n'a pas encore montré les félicitations
      if (allExercisesCompleted && !showCongratulations) {
        setShowCongratulations(true);
      }
    } else {
      setDayCompleted(false);
    }
  }, [currentRitual?.id, currentRitual?.exercises]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });
  
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
  
  const isRitualComplete = () => {
    if (!currentRitual) return false;
    return currentRitual.exercises.every(ex => ex.completedReps >= ex.targetReps);
  };
  
  const handleCompleteDay = async () => {
    if (!isRitualComplete()) {
      Alert.alert(
        "Rituel incomplet",
        "Tu dois terminer tous les rituels pour valider ta journée d'initiation.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      const completed = await completeDay();
      if (completed) {
        setDayCompleted(true);
        setShowCongratulations(true);
      }
    } catch (error) {
      console.error('Erreur lors de la validation du jour:', error);
      Alert.alert('Erreur', 'Impossible de valider la journée. Veuillez réessayer.');
    }
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
        <ImageBackground
          source={require('@/assets/slide1.webp')}
          style={styles.congratsBackground}
        >
          <View style={styles.congratsOverlay}>
            <View style={styles.congratsContainer}>
              <Animated.View style={[animatedStyle, styles.congratsIconContainer]}>
                <Text style={styles.congratsIcon}>🔥</Text>
              </Animated.View>
              
              <Text style={styles.congratsTitle}>BAMAYÉ !</Text>
              <Text style={styles.congratsSubtitle}>
                Tu as accompli ton premier rituel d'initiation
              </Text>
              
              <Text style={styles.congratsMessage}>
                Tu fais maintenant officiellement partie de la tribu MoHero !
                {'\n\n'}
                Pour contribuer pleinement à la force de la tribu, tu dois maintenant choisir ton clan. 
                Chaque clan a ses propres défis et programmes spécialisés.
              </Text>
              
              <Button
                title="Choisir mon clan"
                onPress={handleJoinTribe}
                style={styles.clanButton}
                fullWidth
              />
            </View>
          </View>
        </ImageBackground>
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
          source={require('@/assets/slide1.webp')}
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
                />
              ))}
            </View>
          </View>
          
          <View style={styles.actionContainer}>
            {isRitualComplete() ? (
              <Button
                title={dayCompleted ? "Jour terminé !" : "Valider ma journée d'initiation"}
                onPress={handleCompleteDay}
                style={[styles.completeButton, dayCompleted && styles.completedButton]}
                disabled={dayCompleted}
                fullWidth
              />
            ) : (
              <View style={styles.incompleteContainer}>
                <Text style={styles.incompleteText}>
                  Termine tous les rituels pour valider ta journée d'initiation
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
  congratsBackground: {
    flex: 1,
  },
  congratsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
  congratsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  congratsIconContainer: {
    marginBottom: SPACING.xl,
  },
  congratsIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  congratsTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 32,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  congratsSubtitle: {
    ...FONTS.body,
    color: COLORS.primary,
    fontSize: 18,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  congratsMessage: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  clanButton: {
    minWidth: 200,
  },
  exercisesContainer: {
    position: 'relative',
    zIndex: 1,
  },
}); 
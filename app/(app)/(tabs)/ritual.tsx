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
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import ProgressBar from '@/components/ProgressBar';
import ExerciseCard from '@/components/ExerciseCard';
import Button from '@/components/Button';
import { useProgram } from '@/context/ProgramContext';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { DailyRitual, Exercise } from '@/types';

export default function DailyRitualScreen() {
  const { 
    currentProgram, 
    userPrograms,
    currentRitual,
    getCurrentDayRitual, 
    updateExerciseProgress,
  } = useProgram();
  
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(true);
      await getCurrentDayRitual();
      setIsLoading(false);
    };
    fetchRitual();
  }, [currentProgram, userPrograms]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });
  
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
  
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Chargement du rituel...</Text>
      </View>
    );
  }
  
  if (!currentRitual) {
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
  
  const userProgram = userPrograms.find(up => up.programId === currentProgram.id);
  const dayProgress = userProgram ? `JOUR ${userProgram.currentDay} / ${currentProgram.duration}` : '';
  
  const calculateDailyProgress = () => {
    if (!currentRitual) return 0;
    const totalReps = currentRitual.exercises.reduce((acc: number, ex: Exercise) => acc + ex.targetReps, 0);
    const completedReps = currentRitual.exercises.reduce((acc: number, ex: Exercise) => acc + Math.min(ex.completedReps, ex.targetReps), 0);
    // Limiter à 1 (100%) maximum
    return Math.min(totalReps > 0 ? completedReps / totalReps : 0, 1);
  };
  
  const isRitualComplete = () => {
    if (!currentRitual) return false;
    return currentRitual.exercises.every(ex => ex.completedReps >= ex.targetReps);
  };
  
  // Message dynamique du mentor en fonction de l'état des rituels
  const getMentorMessage = () => {
    if (isRitualComplete()) {
      return ["Félicitations !", " Tu as terminé tous les rituels du jour. On se revoit demain."];
    } else {
      return currentRitual?.quote || "Commence chaque journée, comme si elle avait été écrite pour toi !";
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.programName}>{currentProgram.title}</Text>
        <Text style={styles.dayProgress}>{dayProgress}</Text>
      </View>
      
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
              <Text style={styles.quote}>
                <Text style={styles.completedQuote}>{getMentorMessage()[0]}</Text>
                <Text>{getMentorMessage()[1]}</Text>
              </Text>
            ) : (
              <Text style={styles.quote}>"{getMentorMessage()}"</Text>
            )}
          </View>
        </View>
      </Animated.View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progression du jour</Text>
        <ProgressBar progress={calculateDailyProgress()} height={12} showPercentage />
      </View>
      
      <Text style={styles.exercisesTitle}>RITUELS DU JOUR</Text>
      
      {currentRitual.exercises.map((exercise: Exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onUpdateProgress={updateExerciseProgress}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
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
  header: {
    marginBottom: SPACING.lg,
  },
  programName: {
    ...FONTS.heading,
    color: COLORS.primary,
    fontSize: 26,
    marginBottom: SPACING.xs,
  },
  dayProgress: {
    ...FONTS.body,
    color: COLORS.textSecondary,
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
});
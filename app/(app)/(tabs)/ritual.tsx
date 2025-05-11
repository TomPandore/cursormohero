import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity
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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Aucun programme en cours</Text>
        <Text style={styles.emptyText}>
          Choisissez un programme pour commencer votre voyage.
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
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>RITUEL DU JOUR</Text>
        <Text style={styles.programName}>{currentProgram.title}</Text>
        <Text style={styles.dayProgress}>{dayProgress}</Text>
      </View>
      
      <Animated.View style={[styles.quoteContainer, animatedStyle]}>
        <Text style={styles.quote}>"{currentRitual.quote}"</Text>
      </Animated.View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progression du jour</Text>
        <ProgressBar progress={calculateDailyProgress()} height={12} showPercentage />
      </View>
      
      <Text style={styles.exercisesTitle}>EXERCICES DU JOUR</Text>
      
      {currentRitual.exercises.map((exercise: Exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onUpdateProgress={updateExerciseProgress}
        />
      ))}
      
      {isRitualComplete() && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeTitle}>Félicitations !</Text>
          <Text style={styles.completeText}>
            Vous avez complété tous les exercices du jour. Revenez demain pour continuer votre progression !
          </Text>
        </View>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
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
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    letterSpacing: 2,
  },
  programName: {
    ...FONTS.subheading,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  dayProgress: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  quoteContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  quote: {
    ...FONTS.body,
    color: COLORS.text,
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
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
  completeContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  completeTitle: {
    ...FONTS.heading,
    color: COLORS.success,
    marginBottom: SPACING.sm,
    fontSize: 20,
  },
  completeText: {
    ...FONTS.body,
    color: COLORS.text,
    textAlign: 'center',
  },
});
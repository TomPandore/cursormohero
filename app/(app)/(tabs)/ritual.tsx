import React, { useEffect } from 'react';
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

export default function DailyRitualScreen() {
  const { 
    currentProgram, 
    userPrograms, 
    getCurrentDayRitual, 
    updateExerciseProgress,
    completeDay,
  } = useProgram();
  
  const ritual = getCurrentDayRitual();
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
  
  if (!ritual) {
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
    if (!ritual) return 0;
    
    const totalReps = ritual.exercises.reduce((acc, ex) => acc + ex.targetReps, 0);
    const completedReps = ritual.exercises.reduce((acc, ex) => acc + ex.completedReps, 0);
    
    return completedReps / totalReps;
  };
  
  const isRitualComplete = () => {
    return calculateDailyProgress() === 1;
  };
  
  const handleCompleteDay = () => {
    completeDay();
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>RITUEL DU JOUR</Text>
        <Text style={styles.programName}>{currentProgram.title}</Text>
        <Text style={styles.dayProgress}>{dayProgress}</Text>
      </View>
      
      <Animated.View style={[styles.quoteContainer, animatedStyle]}>
        <Text style={styles.quote}>"{ritual.quote}"</Text>
      </Animated.View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progression du jour</Text>
        <ProgressBar progress={calculateDailyProgress()} height={12} showPercentage />
      </View>
      
      <Text style={styles.exercisesTitle}>EXERCICES DU JOUR</Text>
      
      {ritual.exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onUpdateProgress={updateExerciseProgress}
        />
      ))}
      
      {isRitualComplete() && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeText}>
            Félicitations ! Vous avez complété tous les exercices du jour.
          </Text>
          <Button
            title="Terminer le jour"
            onPress={handleCompleteDay}
            style={styles.completeButton}
          />
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
  },
  completeText: {
    ...FONTS.body,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  completeButton: {
    minWidth: 200,
  },
});
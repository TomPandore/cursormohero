import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import { useAudio } from '@/context/AudioContext';
import { Audio } from 'expo-av';

interface TimerProps {
  targetSeconds: number; // Durée cible en secondes
  onComplete: () => void; // Callback quand le timer se termine
}

export default function Timer({ targetSeconds, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(targetSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playSound } = useAudio();

  // Nettoyer l'intervalle à la destruction du composant
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Gérer le décompte
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            // Jouer le son de fin
            playTimerEndSound();
            // Callback de complétion
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const playTimerEndSound = async () => {
    try {
      // Utiliser un son système ou créer un beep simple
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/music/bamayedrum.mp3')
      );
      await sound.setVolumeAsync(0.3);
      await sound.playAsync();
      
      // Nettoyer après lecture
      setTimeout(() => {
        sound.unloadAsync();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la lecture du son de fin:', error);
    }
  };

  const startTimer = () => {
    if (timeLeft > 0 && !isCompleted) {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(targetSeconds);
    setIsCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = targetSeconds > 0 ? (targetSeconds - timeLeft) / targetSeconds : 0;

  return (
    <View style={styles.container}>
      <View style={styles.timerDisplay}>
        <View style={styles.progressCircle}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.timeText, isCompleted && styles.completedTimeText]}>
          {isCompleted ? 'Terminé !' : formatTime(timeLeft)}
        </Text>
      </View>
      
      <View style={styles.controls}>
        {!isCompleted ? (
          <>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={isRunning ? pauseTimer : startTimer}
              disabled={timeLeft === 0}
            >
              {isRunning ? (
                <Pause color={COLORS.text} size={20} />
              ) : (
                <Play color={COLORS.text} size={20} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={resetTimer}
            >
              <RotateCcw color={COLORS.text} size={20} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetTimer}
          >
            <RotateCcw color={COLORS.text} size={20} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressCircle: {
    width: 120,
    height: 8,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 4,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  timeText: {
    ...FONTS.button,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedTimeText: {
    color: COLORS.success,
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  controlButton: {
    backgroundColor: COLORS.primaryDark,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: COLORS.success,
  },
}); 
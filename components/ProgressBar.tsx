import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS } from '@/constants/Layout';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  showPercentage?: boolean;
  color?: string;
  animationDuration?: number;
}

export default function ProgressBar({
  progress,
  height = 10,
  showPercentage = false,
  color = COLORS.progress.completed,
  animationDuration = 500,
}: ProgressBarProps) {
  const progressValue = useSharedValue(0);
  
  useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: animationDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress, animationDuration]);
  
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });
  
  return (
    <View style={styles.container}>
      <View style={[styles.backgroundBar, { height }]}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { height, backgroundColor: color },
            progressStyle
          ]} 
        />
      </View>
      
      {showPercentage && (
        <Text style={styles.percentageText}>
          {`${Math.round(progress * 100)}%`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  backgroundBar: {
    width: '100%',
    backgroundColor: COLORS.progress.background,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: BORDER_RADIUS.sm,
  },
  percentageText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
});
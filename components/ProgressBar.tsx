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
  title?: string | React.ReactNode;
  percentagePosition?: 'inside' | 'below' | 'right';
}

export default function ProgressBar({
  progress,
  height = 10,
  showPercentage = false,
  color = COLORS.progress.completed,
  animationDuration = 500,
  title,
  percentagePosition = 'right',
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

  const percentage = `${Math.round(progress * 100)}%`;
  
  return (
    <View style={styles.container}>
      {title && (
        typeof title === 'string' 
          ? <Text style={styles.titleText}>{title}</Text>
          : title
      )}
      
      <View style={[styles.backgroundBar, { height }]}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { height, backgroundColor: color },
            progressStyle
          ]} 
        />
        
        {showPercentage && percentagePosition === 'inside' && (
          <View style={styles.insideTextContainer}>
            <Text style={styles.insidePercentageText}>
              {percentage}
            </Text>
          </View>
        )}
      </View>
      
      {showPercentage && percentagePosition === 'below' && (
        <Text style={styles.belowPercentageText}>
          {percentage}
        </Text>
      )}
      
      {showPercentage && percentagePosition === 'right' && (
        <Text style={styles.rightPercentageText}>
          {percentage}
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
    position: 'relative',
  },
  progressBar: {
    borderRadius: BORDER_RADIUS.sm,
  },
  rightPercentageText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  belowPercentageText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  insideTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  insidePercentageText: {
    ...FONTS.caption,
    color: COLORS.text,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    fontSize: 12,
  },
  titleText: {
    ...FONTS.subheading,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/Colors';

interface PaginationDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
  cardWidth: number;
  isSelected: boolean;
}

export default function PaginationDot({ 
  index, 
  scrollX, 
  cardWidth,
  isSelected,
}: PaginationDotProps) {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * cardWidth,
      index * cardWidth,
      (index + 1) * cardWidth,
    ];
    
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1.2, 0.8],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ scale }],
      opacity,
      backgroundColor: isSelected ? COLORS.primary : COLORS.textSecondary,
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
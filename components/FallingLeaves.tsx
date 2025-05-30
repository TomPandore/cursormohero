import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Rect, Polygon } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LEAF_COUNT = 50; // Plus de feuilles pour un effet plus dense
const CONFETTI_COLORS = ['#8A2BE2', '#9370DB', '#9932CC', '#BA55D3']; // Différentes nuances de violet

const Confetti = ({ index }: { index: number }) => {
  // Position de départ aléatoire au bas de l'écran
  const startX = 30 + Math.random() * (SCREEN_WIDTH - 60);
  const x = useSharedValue(startX);
  const y = useSharedValue(SCREEN_HEIGHT);
  const rotation = useSharedValue(Math.random() * 360);
  const scale = useSharedValue(0.5 + Math.random() * 0.5);
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const shape = Math.floor(Math.random() * 3); // 0: cercle, 1: carré, 2: triangle
  
  // Durées et délais plus variables
  const riseDuration = 800 + Math.random() * 700;
  const fallDuration = 1200 + Math.random() * 800;
  const delay = Math.random() * 200;

  // Direction finale aléatoire
  const finalX = startX + (Math.random() * 200 - 100);
  const finalY = SCREEN_HEIGHT + 100; // Tombe un peu plus bas que l'écran

  useEffect(() => {
    const animate = () => {
      y.value = SCREEN_HEIGHT;
      x.value = startX;

      // Animation en deux phases avec des courbes plus naturelles
      y.value = withDelay(
        delay,
        withSequence(
          // Phase 1: Montée avec une courbe plus prononcée
          withTiming(SCREEN_HEIGHT * 0.2, { 
            duration: riseDuration,
            easing: Easing.bezier(0.2, 0.8, 0.2, 1)
          }),
          // Phase 2: Descente plus naturelle
          withTiming(finalY, { 
            duration: fallDuration,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          })
        )
      );

      // Mouvement latéral plus aléatoire
      x.value = withDelay(
        delay,
        withSequence(
          // Phase 1: Écartement plus prononcé
          withTiming(startX + (Math.random() * 300 - 150), { 
            duration: riseDuration,
            easing: Easing.bezier(0.2, 0.8, 0.2, 1)
          }),
          // Phase 2: Dérive plus naturelle
          withTiming(finalX, { 
            duration: fallDuration,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1)
          })
        )
      );

      // Rotation plus aléatoire
      rotation.value = withDelay(
        delay,
        withSequence(
          withTiming(rotation.value + (Math.random() * 720 + 360), { 
            duration: riseDuration + fallDuration,
            easing: Easing.linear
          })
        )
      );
    };

    animate();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const renderShape = () => {
    switch (shape) {
      case 0:
        return <Circle cx="10" cy="10" r="8" fill={color} />;
      case 1:
        return <Rect x="2" y="2" width="16" height="16" fill={color} />;
      case 2:
        return <Polygon points="10,2 18,18 2,18" fill={color} />;
      default:
        return <Circle cx="10" cy="10" r="8" fill={color} />;
    }
  };

  return (
    <Animated.View style={[styles.confetti, animatedStyle]}>
      <Svg width="20" height="20" viewBox="0 0 20 20">
        {renderShape()}
      </Svg>
    </Animated.View>
  );
};

const FallingLeaves = () => {
  const confetti = useMemo(() => Array.from({ length: LEAF_COUNT }, (_, i) => i), []);

  return (
    <View style={styles.container}>
      {confetti.map((index) => (
        <Confetti key={index} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
  },
});

export default FallingLeaves; 
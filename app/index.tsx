import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { Video } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Animation du logo
  const scale = useSharedValue(0.95);
  useEffect(() => {
    scale.value = withTiming(1, { duration: 700 });
  }, []);
  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.background}>
      <Video
        source={require('@/assets/mohero-teaser.mp4')}
        style={styles.video}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
      />
      
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.actions}>
            <Link href="/(auth)/signup" asChild>
              <Button 
                title="Rejoins le mouvement" 
                fullWidth
              />
            </Link>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà membre ?</Text>
              <Link href="/(auth)/login" asChild>
                <Text style={styles.loginLink}>Se connecter</Text>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Overlay sombre pour améliorer la lisibilité
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2, // Plus d'espace en bas pour éviter la zone de navigation
  },
  actions: {
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loginText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...FONTS.body,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
});
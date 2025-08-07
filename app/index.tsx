import { View, Text, StyleSheet, Image, ImageBackground, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    <ImageBackground
      source={require('@/assets/welcome5.webp')}
      style={styles.background}
      resizeMode="cover"
    >
         

      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.Image source={require('@/assets/logo-vertical.png')} style={[styles.logoImage, animatedLogoStyle]} resizeMode="contain" />
          <Text style={styles.slogan}>Que le ciel soit ta seule limite</Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Link href="/(auth)/signup" asChild>
            <Button 
              title="Rejoindre la tribu" 
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
    </ImageBackground>
  );
}

// Calculs responsives basés sur la taille de l'écran
const isSmallScreen = screenHeight < 700;
const logoSize = isSmallScreen ? Math.min(screenWidth * 0.4, 150) : Math.min(screenWidth * 0.5, 200);
const topPadding = isSmallScreen ? SPACING.xl : SPACING.xl * 2;
const sloganFontSize = isSmallScreen ? 16 : 20;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl, // Assurer une marge en bas
  },
  content: {
    alignItems: 'center',
    paddingTop: topPadding,
    minHeight: screenHeight * 0.4, // Prendre au minimum 40% de l'écran
  },
  logoImage: {
    width: logoSize,
    height: logoSize,
    marginBottom: isSmallScreen ? -10 : -20,
  },
  slogan: {
    ...FONTS.body,
    color: '#fff',
    fontSize: sloganFontSize,
    textAlign: 'center',
    marginTop: 0,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    paddingHorizontal: SPACING.md,
  },
  spacer: {
    flex: 1, // Prend l'espace restant pour pousser les actions vers le bas
    minHeight: isSmallScreen ? SPACING.lg : SPACING.xl * 2,
  },
  actions: {
    width: '100%',
    paddingBottom: SPACING.md, // Marge de sécurité au-dessus de la navigation
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm, // Augmenter la zone de touch
  },
  loginText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: isSmallScreen ? 14 : 16,
  },
  loginLink: {
    ...FONTS.body,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    paddingHorizontal: SPACING.xs, // Augmenter la zone de touch
    paddingVertical: SPACING.xs,
  },
});
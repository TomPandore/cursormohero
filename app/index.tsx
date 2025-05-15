import { View, Text, StyleSheet, Image, ImageBackground } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: SPACING.xl * 2,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: -20,
  },
  slogan: {
    ...FONTS.body,
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 0,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
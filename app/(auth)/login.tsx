import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading } = useAuth();

  // Validation email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    // Nettoyer l'erreur précédente
    setError('');

    // Validation des champs
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Veuillez entrer un email valide');
      return;
    }

    try {
      await signIn(email, password);
    } catch (err: any) {
      // Gestion d'erreurs plus détaillée
      if (err?.message?.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else if (err?.message?.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter');
      } else if (err?.message?.includes('Too many requests')) {
        setError('Trop de tentatives. Veuillez patienter quelques minutes');
      } else if (!navigator.onLine) {
        setError('Pas de connexion internet');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer');
      }
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/welcome3.webp')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']}
        style={styles.overlay}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
              <Image 
                source={require('@/assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
          </View>

          <View style={styles.formContainer}>
              <Text style={styles.questionText}>
                Bienvenue dans la tribu
              </Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                  placeholder="ton@email.com"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  // Nettoyer l'erreur quand l'utilisateur tape
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                    placeholder="Ton mot de passe"
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    // Nettoyer l'erreur quand l'utilisateur tape
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={20} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              isLoading={isLoading}
              fullWidth
                style={styles.button}
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Pas encore de compte ?
              </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signupLink}>Inscrivez-vous</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    paddingTop: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  logo: {
    width: 200,
    height: 60,
  },
  title: {
    ...FONTS.heading,
    fontSize: 40,
    fontFamily: 'Rajdhani-Bold',
    color: COLORS.text,
    letterSpacing: 5,
  },
  subtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  questionText: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    ...FONTS.body,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.sm,
    height: 50,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    ...FONTS.body,
  },
  // Nouveaux styles pour le champ mot de passe avec icône
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.sm,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    ...FONTS.body,
  },
  eyeButton: {
    padding: SPACING.md,
  },
  button: {
    marginTop: SPACING.md,
  },
  signupContainer: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  signupLink: {
    ...FONTS.body,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
});
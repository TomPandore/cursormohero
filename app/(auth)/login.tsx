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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      await signIn(email, password);
    } catch (err) {
      setError('Identifiants incorrects');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', COLORS.background]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>MOHERO</Text>
            <Text style={styles.subtitle}>FORCE · MOBILITÉ · ÉQUILIBRE</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Connectez-vous</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre email"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre mot de passe"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              isLoading={isLoading}
              fullWidth
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Pas encore de compte ?
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/onboarding')}>
                <Text style={styles.signupLink}>Inscrivez-vous</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
  formTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    ...FONTS.body,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.md,
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
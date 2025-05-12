import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signUp, isLoading } = useAuth();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await signUp(name.trim(), email.trim(), password.trim());
      router.push('/(auth)/onboarding/clan');
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
    }
  };

  return (
    <ImageBackground 
      source={require('@/assets/background.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
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
                Toute légende commence par un nom, toi, qui es-tu ?
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pseudo ou nom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ton nom de légende"
                  placeholderTextColor={COLORS.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ton@email.com"
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
                  placeholder="Minimum 6 caractères"
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Button
                title="Continuer"
                onPress={handleSignup}
                isLoading={isLoading}
                fullWidth
                style={styles.button}
              />
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
  button: {
    marginTop: SPACING.md,
  },
});
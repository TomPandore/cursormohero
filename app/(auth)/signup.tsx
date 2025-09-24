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
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'homme' | 'femme' | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, isLoading } = useAuth();

  const genderOptions = [
    { label: 'Un Homme', value: 'homme' as const },
    { label: 'Une Femme', value: 'femme' as const },
  ];

  // Validation email robuste
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Calcul de la force du mot de passe
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { level: 'weak', color: COLORS.error, text: 'Faible' };
    if (score <= 3) return { level: 'medium', color: '#FFA500', text: 'Moyen' };
    return { level: 'strong', color: COLORS.success, text: 'Fort' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const handleSignup = async () => {
    // Reset erreur au début
    setError('');

    // Validation des champs vides
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Validation email
    if (!isValidEmail(email.trim())) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    // Validation mot de passe
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Validation confirmation mot de passe
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!gender) {
      setError('Veuillez sélectionner votre genre');
      return;
    }

    try {
      await signUp(name.trim(), email.trim(), password.trim(), gender);
      // La redirection est gérée dans la fonction signUp vers onboarding
    } catch (err: any) {
      // Gestion d'erreurs spécifiques
      if (err.message?.includes('already registered') || err.message?.includes('already_registered')) {
        setError('Cette adresse email est déjà utilisée');
      } else if (err.message?.includes('weak-password') || err.message?.includes('weak_password')) {
        setError('Le mot de passe est trop faible');
      } else if (err.message?.includes('invalid-email') || err.message?.includes('invalid_email')) {
        setError('Format d\'email invalide');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Erreur de connexion. Vérifiez votre réseau.');
      } else {
        setError('Une erreur est survenue lors de l\'inscription');
        console.error('Erreur signup détaillée:', err);
      }
    }
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/background-home-v2.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
        style={styles.overlay}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            

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
                  onChangeText={(text) => setName(text.trim())}
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
                  onChangeText={(text) => setEmail(text.trim())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tu es ?</Text>
                <View style={styles.genderOptionsContainer}>
                  {genderOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.genderOption,
                        gender === option.value && styles.genderOptionSelected,
                        index === genderOptions.length - 1 && styles.genderOptionLast,
                      ]}
                      onPress={() => setGender(option.value)}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          gender === option.value && styles.genderOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Minimum 6 caractères"
                    placeholderTextColor={COLORS.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
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
                {passwordStrength && (
                  <View style={styles.strengthContainer}>
                    <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                      Force : {passwordStrength.text}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Répétez votre mot de passe"
                    placeholderTextColor={COLORS.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={COLORS.textSecondary} />
                    ) : (
                      <Eye size={20} color={COLORS.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
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
  genderOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderOption: {
    flex: 1,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: SPACING.sm,
  },
  genderOptionLast: {
    marginRight: 0,
  },
  genderOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  genderOptionText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  genderOptionTextSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  strengthBar: {
    height: 3,
    width: 40,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  strengthText: {
    ...FONTS.caption,
    fontSize: 12,
  },
  button: {
    marginTop: SPACING.md,
  },
}); 

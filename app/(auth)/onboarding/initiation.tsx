import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Alert
} from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useProgram } from '@/context/ProgramContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const INITIATION_PROGRAM_ID = 'ecc043c9-61ac-429c-8811-530a4896fd04';

export default function InitiationScreen() {
  const { programs, selectProgram, isLoading } = useProgram();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  
  const program = programs.find(p => p.id === INITIATION_PROGRAM_ID);
  
  useEffect(() => {
    // Marquer l'onboarding comme terminé si ce n'est pas déjà fait
    const updateOnboardingStatus = async () => {
      if (user && user.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_done: true })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating onboarding status:', error);
        }
      }
    };

    updateOnboardingStatus();
  }, [user]);
  
  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Programme d'initiation non trouvé</Text>
        <Button
          title="Retour"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }
  
  const handleStartInitiation = async () => {
    try {
      setIsStarting(true);
      
      // Sélectionner le programme d'initiation
      await selectProgram(INITIATION_PROGRAM_ID);
      
      // Rediriger vers l'écran de rituel d'initiation
      router.replace('/(auth)/onboarding/ritual');
    } catch (error) {
      console.error('Error starting initiation:', error);
      Alert.alert('Erreur', 'Impossible de commencer l\'initiation. Veuillez réessayer.');
    } finally {
      setIsStarting(false);
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={{ uri: program.imageUrl }}
          style={styles.imageBackground}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>Bienvenue dans</Text>
              <Text style={styles.title}>{program.title}</Text>
              
              <View style={styles.detailsRow}>
                {program.focus.map((focus, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{focus}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
        
        <View style={styles.contentContainer}>
          <Text style={styles.initiationText}>
            Avant de pouvoir choisir ton clan et accéder aux programmes avancés, 
            tu dois accomplir ce rite d'initiation.
          </Text>
          
          <Text style={styles.durationText}>
            Programme de <Text style={styles.durationNumber}>{program.duration}</Text> jours
          </Text>
          <Text style={styles.description}>{program.description}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ce que tu vas développer</Text>
            <View style={styles.benefitsContainer}>
              {program.details.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Check size={18} color={COLORS.primary} style={styles.checkIcon} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ton parcours d'initiation</Text>
            {program.details.phases.map((phase, index) => (
              <View key={index} style={styles.phaseItem}>
                <View style={styles.phaseBullet}>
                  <Text style={styles.phaseBulletText}>{index + 1}</Text>
                </View>
                <View style={styles.phaseContent}>
                  <Text style={styles.phaseTitle}>{phase.title}</Text>
                  <Text style={styles.phaseDescription}>{phase.description}</Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚡ Une fois l'initiation terminée, tu rejoindras officiellement la tribu MoHero
            </Text>
          </View>
          
          <Button
            title="Commencer l'initiation"
            onPress={handleStartInitiation}
            isLoading={isStarting}
            fullWidth
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...FONTS.heading,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  errorButton: {
    minWidth: 150,
  },
  imageBackground: {
    height: 350,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  welcomeText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 32,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  badge: {
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  badgeText: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 12,
  },
  contentContainer: {
    padding: SPACING.lg,
    flex: 1,
  },
  initiationText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  durationText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  durationNumber: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  description: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 20,
    marginBottom: SPACING.md,
  },
  benefitsContainer: {
    gap: SPACING.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  checkIcon: {
    marginTop: 2,
  },
  benefitText: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  phaseItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  phaseBullet: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  phaseBulletText: {
    ...FONTS.button,
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
  phaseContent: {
    flex: 1,
  },
  phaseTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    fontSize: 18,
    marginBottom: SPACING.xs,
  },
  phaseDescription: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: COLORS.primary + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    marginBottom: SPACING.xl,
  },
  warningText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: SPACING.md,
  },
}); 
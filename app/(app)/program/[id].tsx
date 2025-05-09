import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ImageBackground, 
  TouchableOpacity 
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useProgram } from '@/context/ProgramContext';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { programs, selectProgram, userPrograms, isLoading } = useProgram();
  
  const program = programs.find(p => p.id === id);
  
  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Programme non trouvé</Text>
        <Button
          title="Retour"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }
  
  const isProgramSelected = userPrograms.some(up => up.programId === program.id);
  
  const handleSelectProgram = async () => {
    await selectProgram(program.id);
    router.replace('/(app)/(tabs)/ritual');
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
          headerTitle: '',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={{ uri: program.imageUrl }}
          style={styles.imageBackground}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.title}>{program.title}</Text>
              
              <View style={styles.detailsRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{program.duration} jours</Text>
                </View>
                
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
          <Text style={styles.description}>{program.description}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À quoi s'attendre</Text>
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
            <Text style={styles.sectionTitle}>Phases du parcours</Text>
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
          
          <Button
            title={isProgramSelected ? "Continuer le programme" : "Commencer le programme"}
            onPress={handleSelectProgram}
            isLoading={isLoading}
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
  backButton: {
    padding: SPACING.sm,
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
    height: 300,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: SPACING.lg,
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  badgeText: {
    ...FONTS.caption,
    color: COLORS.text,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  description: {
    ...FONTS.body,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  benefitsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  checkIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  benefitText: {
    ...FONTS.body,
    color: COLORS.text,
    flex: 1,
  },
  phaseItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  phaseBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  phaseBulletText: {
    ...FONTS.button,
    fontSize: 14,
    color: COLORS.text,
  },
  phaseContent: {
    flex: 1,
  },
  phaseTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontSize: 16,
  },
  phaseDescription: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  actionButton: {
    marginVertical: SPACING.lg,
  },
});
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ImageBackground, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useProgram } from '@/context/ProgramContext';
import Animated, { useSharedValue, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Check, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const CLAN_PROGRAMS = {
  EKLOA: {
    id: 'b378d5ab-0e4d-4436-98d3-408e7d268eb6',
    name: 'Ekloa',
    title: 'La lame du vent',
  },
  ONOTKA: {
    id: 'a0f7a883-f806-423b-827d-97bc004c7c17',
    name: 'Onotka',
    title: "L'ombre du Colosse",
  },
  OKWAHO: {
    id: '692d1aae-f2b0-45b8-88d1-f9ef351b0b75',
    name: 'Okwáho',
    title: 'La rivière du sage',
  },
};

export default function WelcomeClanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { programs, selectProgram } = useProgram();
  const [loading, setLoading] = useState(false);
  const [clanName, setClanName] = useState('');
  const [clanMapping, setClanMapping] = useState<Record<string, string>>({});
  const [isLoadingClanData, setIsLoadingClanData] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'Héros';
  
  // Récupérer le nom du clan ET créer le mapping ID clan -> ID programme
  useEffect(() => {
    const fetchClanData = async () => {
      if (!user?.clanId) {
        setIsLoadingClanData(false);
        return;
      }
      
      try {
        setIsLoadingClanData(true);
        // Récupérer tous les clans pour créer le mapping
        const { data: clans, error: clansError } = await supabase
          .from('clans')
          .select('id, nom_clan');
          
        if (clansError) throw clansError;
        
        // Créer le mapping ID clan -> ID programme
        const mapping: Record<string, string> = {};
        clans?.forEach(clan => {
          const clanName = clan.nom_clan.toUpperCase();
          if (clanName === 'EKLOA') {
            mapping[clan.id] = 'b378d5ab-0e4d-4436-98d3-408e7d268eb6';
          } else if (clanName === 'ONOTKA') {
            mapping[clan.id] = 'a0f7a883-f806-423b-827d-97bc004c7c17';
          } else if (clanName === 'OKWÁHO' || clanName === 'OKWAHO') {
            mapping[clan.id] = '692d1aae-f2b0-45b8-88d1-f9ef351b0b75';
          }
        });
        
        setClanMapping(mapping);
        
        // Récupérer le nom du clan de l'utilisateur
        const userClan = clans?.find(clan => clan.id === user.clanId);
        if (userClan) setClanName(userClan.nom_clan);
      } catch (err) {
        console.error('Error fetching clan data:', err);
      } finally {
        setIsLoadingClanData(false);
      }
    };

    fetchClanData();
  }, [user?.clanId]);

  // Trouver le programme correspondant au clan de l'utilisateur
  const programId = clanMapping[user?.clanId || ''];
  const program = programs.find(p => p.id === programId);

  // Animation d'apparition
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) }));
  }, []);

  // Debug temporaire
  useEffect(() => {
    console.log('user?.clanId:', user?.clanId);
    console.log('programs:', programs);
    if (program) {
      console.log('Programme trouvé pour ce clan:', program);
    } else {
      console.log('Aucun programme trouvé pour ce clan');
    }
  }, [user?.clanId, programs]);

  const handleStart = async () => {
    if (!program) return;
    setLoading(true);
    try {
      await selectProgram(program.id);
      router.replace('/(app)/(tabs)/ritual');
    } catch (e) {
      Alert.alert('Erreur', "Impossible de rejoindre le programme. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Affichage de chargement si les programmes ne sont pas encore chargés
  if (!programs || programs.length === 0 || isLoadingClanData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.text }}>Chargement...</Text>
      </View>
    );
  }

  // Affichage d'un message d'erreur si aucun programme n'est trouvé pour le clan
  if (!program) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.text, textAlign: 'center', marginHorizontal: 32 }}>
          Aucun programme n'a été trouvé pour ton clan. Merci de contacter le support ou de réessayer plus tard.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <View style={styles.spacerTop} />
          <Text style={styles.welcome}>{firstName} ! Bienvenue dans le clan {clanName}</Text>
          <Text style={styles.intro}>Voici la voie du clan</Text>
          <ChevronDown size={32} color={COLORS.primary} style={styles.chevron} />
        </View>
        <View style={styles.programCard}>
          <View style={styles.programImageWrapper}>
            {program?.imageUrl && (
              <ImageBackground
                source={{ uri: program.imageUrl }}
                style={styles.programImage}
                imageStyle={styles.programImageStyle}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
                  style={styles.programImageOverlay}
                >
                  <View style={styles.programOverlayContent}>
                    <Text style={styles.programTitle}>{program.title}</Text>
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
            )}
          </View>
        </View>
        <View style={styles.programCardContent}>
          <Text style={styles.programDuration}>
            Programme de <Text style={styles.programDurationNumber}>{program.duration}</Text> jours
          </Text>
          <Text style={styles.description}>{program.description}</Text>
          {program.details.benefits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attendez-vous à</Text>
              <View style={styles.benefitsContainer}>
                {program.details.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Check size={18} color={COLORS.primary} style={styles.checkIcon} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {program.details.phases.length > 0 && (
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
          )}
          <Button
            title={loading ? 'Chargement...' : 'Commencer'}
            onPress={handleStart}
            style={styles.actionButton}
            fullWidth
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
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
  headerBlock: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: 32,
    paddingHorizontal: SPACING.lg,
  },
  spacerTop: {
    height: 64,
  },
  welcome: {
    ...FONTS.heading,
    color: COLORS.primary,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  intro: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  chevron: {
    marginTop: 2,
    marginBottom: 8,
  },
  programCard: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  programImageWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  programImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  programImageStyle: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  programImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'flex-end',
  },
  programOverlayContent: {
    padding: SPACING.lg,
    paddingTop: 32,
    paddingBottom: 16,
  },
  programTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  programCardContent: {
    padding: SPACING.lg,
  },
  programDuration: {
    ...FONTS.subheading,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'left',
  },
  programDurationNumber: {
    ...FONTS.heading,
    color: COLORS.primary,
    fontSize: 24,
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
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    minHeight: 48,
    width: '100%',
    alignSelf: 'center',
  },
}); 
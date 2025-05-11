import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useProgram } from '@/context/ProgramContext';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

interface ClanData {
  nom_clan: string;
  couleur_theme: string;
  image_url: string;
  rituel_entree: string;
}

export default function TotemScreen() {
  const { user } = useAuth();
  const { currentProgram, userPrograms } = useProgram();
  const [clanData, setClanData] = useState<ClanData | null>(null);
  
  const glowValue = useSharedValue(0);
  
  useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    if (user?.clanId) {
      fetchClanData();
    }
  }, [user?.clanId]);

  const fetchClanData = async () => {
    try {
      const { data, error } = await supabase
        .from('clans')
        .select('nom_clan, couleur_theme, image_url, rituel_entree')
        .eq('id', user?.clanId)
        .single();

      if (error) throw error;
      if (data) setClanData(data);
    } catch (error) {
      console.error('Error fetching clan data:', error);
    }
  };

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.7 + glowValue.value * 0.3,
      transform: [{ scale: 1 + glowValue.value * 0.05 }],
    };
  });

  if (!user || !clanData) return null;

  const getClanColor = () => {
    return clanData.couleur_theme || COLORS.primary;
  };
  
  const getCurrentProgramProgress = () => {
    if (!currentProgram) return 0;
    
    const userProgram = userPrograms.find(up => up.programId === currentProgram.id);
    if (!userProgram) return 0;
    
    return userProgram.currentDay / currentProgram.duration;
  };

  const handleChangeClan = () => {
    router.push('/(auth)/onboarding/clan');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>VOTRE TOTEM</Text>
      </View>
      
      <View style={styles.totemContainer}>
        <ImageBackground
          source={{ uri: clanData.image_url }}
          style={styles.clanBackground}
          imageStyle={styles.clanBackgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            <Animated.View 
              style={[
                styles.glowCircle, 
                { backgroundColor: getClanColor() }, 
                animatedGlowStyle
              ]} 
            />
            
            <View style={styles.totemContent}>
              <Text style={styles.welcomeText}>Bienvenue, {user.name}</Text>
              
              <View style={[styles.clanBadge, { backgroundColor: getClanColor() }]}>
                <Text style={styles.clanName}>CLAN {clanData.nom_clan}</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.totalDaysCompleted}</Text>
                  <Text style={styles.statLabel}>JOURS ACCOMPLIS</Text>
                </View>
                
                {currentProgram ? (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {userPrograms.find(up => up.programId === currentProgram.id)?.currentDay || 0}/{currentProgram.duration}
                    </Text>
                    <Text style={styles.statLabel}>PROGRESSION</Text>
                  </View>
                ) : null}
              </View>
              
              {currentProgram ? (
                <View style={styles.programContainer}>
                  <Text style={styles.programTitle}>{currentProgram.title}</Text>
                  <ProgressBar 
                    progress={getCurrentProgramProgress()} 
                    showPercentage 
                    color={getClanColor()}
                  />
                </View>
              ) : (
                <View style={styles.noProgramContainer}>
                  <Text style={styles.noProgramText}>
                    Aucun programme en cours
                  </Text>
                  <Button
                    title="Choisir un programme"
                    onPress={() => router.push('/(app)/(tabs)/voies')}
                    size="small"
                    style={styles.programButton}
                  />
                </View>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
      
      <View style={styles.clanInfoContainer}>
        <View style={styles.clanInfoHeader}>
          <Text style={styles.sectionTitle}>TU ES UN {clanData.nom_clan} !</Text>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: getClanColor() }]}
            onPress={handleChangeClan}
          >
            <RefreshCw size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.clanInfoCard}>
          <Text style={styles.ritualText}>{clanData.rituel_entree}</Text>
        </View>
      </View>
      
      <View style={styles.journeyContainer}>
        <Text style={styles.sectionTitle}>TON VOYAGE</Text>
        
        <View style={styles.journeyCard}>
          <Text style={styles.journeyText}>
            "Le chemin du guerrier est parsemé d'épreuves, mais chaque défi surmonté te rapproche de ta véritable nature."
          </Text>
          
          <View style={styles.journeyStat}>
            <Text style={styles.journeyLabel}>Jours d'entraînement tribal :</Text>
            <Text style={styles.journeyValue}>{user.totalDaysCompleted}</Text>
          </View>
          
          {currentProgram ? (
            <TouchableOpacity 
              style={[styles.ritualButton, { backgroundColor: getClanColor() }]}
              onPress={() => router.push('/(app)/(tabs)/ritual')}
            >
              <Text style={styles.ritualButtonText}>Voir le rituel du jour</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    letterSpacing: 2,
  },
  totemContainer: {
    height: 400,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  clanBackground: {
    flex: 1,
  },
  clanBackgroundImage: {
    borderRadius: BORDER_RADIUS.lg,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  glowCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.4,
  },
  totemContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  welcomeText: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 26,
    marginBottom: SPACING.md,
  },
  clanBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  clanName: {
    ...FONTS.button,
    color: COLORS.text,
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  statValue: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 28,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  programContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  programTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  noProgramContainer: {
    alignItems: 'center',
  },
  noProgramText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  programButton: {
    minWidth: 200,
  },
  clanInfoContainer: {
    marginBottom: SPACING.xl,
  },
  clanInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clanInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  ritualText: {
    ...FONTS.body,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  journeyContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  journeyCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  journeyText: {
    ...FONTS.body,
    color: COLORS.text,
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  journeyStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  journeyLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  journeyValue: {
    ...FONTS.body,
    color: COLORS.text,
    fontFamily: 'Rajdhani-Bold',
  },
  ritualButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  ritualButtonText: {
    ...FONTS.button,
    color: COLORS.text,
  },
});
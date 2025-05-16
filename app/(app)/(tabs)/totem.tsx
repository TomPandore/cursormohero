import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ImageBackground,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useProgram } from '@/context/ProgramContext';
import { supabase } from '@/lib/supabase';
import { fetchUserStats, UserStats } from '@/lib/statsUtils';
import { ChevronRight, Flame, Dumbbell, Activity, Wind } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ClanData {
  nom_clan: string;
  couleur_theme: string;
  image_totem: string;
  image_url: string;
  rituel_entree: string;
}

export default function TotemScreen() {
  console.log("Rendu du composant TotemScreen");
  const { user } = useAuth();
  const { currentProgram, userPrograms, currentRitual } = useProgram();
  const [clanData, setClanData] = useState<ClanData | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    consecutiveDays: 0,
    totalDaysCompleted: 0,
    totalPushups: 0,
    totalSquats: 0,
    totalBreathingExercises: 0
  });
  
  // Vérifier si l'écran est actuellement focalisé
  const isFocused = useIsFocused();
  
  // Charger les données du clan lorsque l'utilisateur change
  useEffect(() => {
    if (user?.clanId) {
      fetchClanData();
    }
  }, [user?.clanId]);
  
  // Charger les statistiques utilisateur à chaque fois que l'écran est affiché
  // et lorsque l'utilisateur ou le rituel actuel change
  useEffect(() => {
    if (user?.id && (currentRitual || isFocused)) {
      loadUserStats();
      console.log("Chargement des statistiques utilisateur déclenché", 
        isFocused ? "par focus" : "par changement de rituel");
    }
  }, [user?.id, currentRitual, isFocused]);

  const fetchClanData = async () => {
    try {
      const { data, error } = await supabase
        .from('clans')
        .select('nom_clan, couleur_theme, image_totem, image_url, rituel_entree')
        .eq('id', user?.clanId)
        .single();

      if (error) throw error;
      if (data) setClanData(data);
    } catch (error) {
      console.error('Error fetching clan data:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Début du chargement des statistiques utilisateur');
      const stats = await fetchUserStats(user.id);
      setUserStats(stats);
      console.log('Statistiques utilisateur chargées:', stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques utilisateur:', error);
    }
  };

  if (!user || !clanData) return null;

  const getClanColor = () => {
    return clanData.couleur_theme || COLORS.primary;
  };
  
  const getCurrentProgramProgress = () => {
    if (!currentProgram) return 0;
    
    const userProgram = userPrograms.find(up => up.programId === currentProgram.id);
    if (!userProgram) return 0;
    
    // Si l'utilisateur est au jour 1
    if (userProgram.currentDay <= 1) {
      // Vérifier si le rituel du jour est complété
      if (currentRitual && currentRitual.exercises.length > 0) {
        const totalExercises = currentRitual.exercises.length;
        const completedExercises = currentRitual.exercises.filter(
          ex => ex.completedReps >= ex.targetReps
        ).length;
        
        // Calculer le pourcentage de progression pour le jour 1
        // Ce pourcentage représentera une fraction du premier jour du programme
        if (totalExercises > 0) {
          const dayProgress = completedExercises / totalExercises;
          // Nous divisons par la durée totale pour obtenir la progression "par jour"
          return dayProgress / currentProgram.duration;
        }
      }
      return 0;
    }
    
    // Pour les jours après le jour 1
    // Calculer la progression basée sur les jours complétés
    const baseProgress = (userProgram.currentDay - 1) / currentProgram.duration;
    
    // Ajouter la progression du jour en cours si des exercices sont complétés
    if (currentRitual && currentRitual.exercises.length > 0) {
      const totalExercises = currentRitual.exercises.length;
      const completedExercises = currentRitual.exercises.filter(
        ex => ex.completedReps >= ex.targetReps
      ).length;
      
      if (totalExercises > 0) {
        const dayProgress = completedExercises / totalExercises;
        // Ajouter la progression du jour en cours (pondérée par la durée du programme)
        return baseProgress + (dayProgress / currentProgram.duration);
      }
    }
    
    return baseProgress;
  };

  const handleChangeClan = () => {
    router.push('/(auth)/onboarding/clan');
  };

  const getAvatarUrl = (clanName: string) => {
    if (!clanName) {
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-base.png';
    }
    
    if (clanName.toUpperCase().includes('ONOTKA')) {
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-onotka.png';
    } else if (clanName.toUpperCase().includes('EKLOA')) {
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-ekloa.png';
    } else if (clanName.toUpperCase().includes('OKWÁHO') || clanName.toUpperCase().includes('OKWAHO')) {
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-okwadho.png';
    } else {
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-base.png';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.totemContainer}>
        <ImageBackground
          source={{ uri: clanData.image_totem || clanData.image_url }}
          style={styles.clanBackground}
          imageStyle={styles.clanBackgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          >
            <View style={styles.totemContent}>
              <View style={[styles.clanBadge, { backgroundColor: getClanColor() }]}>
                <Text style={styles.clanName}>CLAN {clanData.nom_clan}</Text>
              </View>
              
              <View style={styles.badgesContainer}>
                <View style={styles.statBadge}>
                  <Flame size={18} color={getClanColor()} />
                  <Text style={styles.badgeValue}>{userStats.consecutiveDays}</Text>
                  <Text style={styles.badgeLabel}>Jours terminés</Text>
                </View>
                
                <View style={styles.statBadge}>
                  <Dumbbell size={18} color={getClanColor()} />
                  <Text style={styles.badgeValue}>{userStats.totalPushups}</Text>
                  <Text style={styles.badgeLabel}>pompes réalisées</Text>
                </View>
                
                <View style={styles.statBadge}>
                  <Activity size={18} color={getClanColor()} />
                  <Text style={styles.badgeValue}>{userStats.totalSquats}</Text>
                  <Text style={styles.badgeLabel}>squats effectués</Text>
                </View>
                
                <View style={styles.statBadge}>
                  <Wind size={18} color={getClanColor()} />
                  <Text style={styles.badgeValue}>{userStats.totalBreathingExercises}</Text>
                  <Text style={styles.badgeLabel}>Souffle maîtrisé</Text>
                  </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
              </View>
              
      <View style={styles.programOuterContainer}>
              {currentProgram ? (
                <View style={styles.programContainer}>
                  <ProgressBar 
                    progress={getCurrentProgramProgress()} 
                    showPercentage 
                    color={getClanColor()}
              percentagePosition="inside"
              title={
                <View style={styles.programTitleContainer}>
                  <Text style={styles.programTitlePrefix}>Voie en cours : </Text>
                  <Text style={styles.programTitleName}>{currentProgram.title}</Text>
                </View>
              }
              height={20}
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
      
      <View style={styles.clanInfoContainer}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://mohero.fr/wp-content/uploads/2025/05/avatar-base.png' }}
            style={[styles.avatarImage, { borderColor: getClanColor() }]}
          />
        </View>
        
        <View style={styles.clanInfoCard}>
          <Text style={[styles.clanTitle, { color: getClanColor() }]}>
            {user.name.toUpperCase()}, TU ES UN {clanData.nom_clan}
          </Text>
          <Text style={styles.ritualText}>{clanData.rituel_entree}</Text>
        </View>
      </View>
      
      <View style={styles.changeClanContainer}>
        <Text style={styles.sectionTitle}>REJOINDRE UN AUTRE CLAN</Text>
        
        <View style={styles.changeClanCard}>
          <Text style={styles.changeClanDescription}>
            Tu peux quitter ton clan actuel pour en rejoindre un autre.
            Tu gardes ta progression, mais ton entraînement changera de philosophie.
          </Text>
          
          <Text style={styles.noteText}>
            Dans cette version de l'application, le choix du clan n'influence pas votre parcours.
          </Text>
          
            <TouchableOpacity 
            style={styles.changeClanLink}
            onPress={handleChangeClan}
            >
            <Text style={[styles.changeClanText, { color: getClanColor() }]}>Changer de clan</Text>
            <ChevronRight size={16} color={getClanColor()} />
            </TouchableOpacity>
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
    paddingBottom: SPACING.lg,
  },
  totemContainer: {
    height: 450,
    width: SCREEN_WIDTH,
  },
  clanBackground: {
    flex: 1,
    width: '100%',
  },
  clanBackgroundImage: {
    width: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  totemContent: {
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
  },
  welcomeText: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.md,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  clanBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
    alignSelf: 'center',
  },
  clanName: {
    ...FONTS.button,
    color: COLORS.text,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  programOuterContainer: {
    marginTop: 0,
    width: SCREEN_WIDTH,
  },
  programContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
  },
  programTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  programTitlePrefix: {
    ...FONTS.subheading,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  programTitleName: {
    ...FONTS.subheading,
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  noProgramContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
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
    position: 'relative',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  avatarContainer: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    backgroundColor: COLORS.card,
    padding: 3,
    borderRadius: 43,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  clanInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl + 50,
    marginTop: 40,
    width: '100%',
  },
  clanTitle: {
    ...FONTS.heading,
    fontSize: 18,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  changeClanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  changeClanText: {
    ...FONTS.button,
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  ritualText: {
    ...FONTS.body,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  sectionTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  changeClanContainer: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  changeClanCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  changeClanDescription: {
    ...FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  changeClanButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  changeClanButtonText: {
    ...FONTS.button,
    color: COLORS.text,
  },
  bottomContent: {
    display: 'none',
  },
  badgesContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBadge: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.sm,
    padding: 4,
  },
  badgeValue: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  badgeLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  spacer: {
    flex: 1,
    minHeight: 150,
  },
  noteText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
});
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity,
  Pressable,
  ScrollView,
  StatusBar,
  Dimensions,
  BackHandler,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import ProgressBar from './ProgressBar';
import { Play, X, Check, Pause } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { Exercise } from '@/types';
import { useWindowDimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdateProgress: (exerciseId: string, reps: number) => void;
}

interface ExerciseDetailsProps {
  exercise: Exercise;
  onClose: () => void;
}

interface OverlayPortalProps {
  children: React.ReactNode;
  isVisible: boolean;
}

function ExerciseDetails({ exercise, onClose }: ExerciseDetailsProps) {
  const dimensions = useWindowDimensions();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { user } = useAuth();
  const [clanInfo, setClanInfo] = useState<{ nom_clan: string } | null>(null);
  
  // Récupérer les informations du clan à partir de l'ID
  useEffect(() => {
    const fetchClanInfo = async () => {
      if (user?.clanId) {
        console.log('Fetching clan info for ID:', user.clanId);
        
        try {
          const { data, error } = await supabase
            .from('clans')
            .select('nom_clan')
            .eq('id', user.clanId)
            .single();
            
          if (error) {
            console.error('Error fetching clan info:', error);
          } else if (data) {
            console.log('Clan info retrieved:', data);
            setClanInfo(data);
          }
        } catch (err) {
          console.error('Exception while fetching clan info:', err);
        }
      } else {
        console.log('No clan ID available for user');
      }
    };
    
    fetchClanInfo();
  }, [user]);

  useEffect(() => {
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
      backHandler.remove();
    };
  }, [onClose]);

  const togglePlayback = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  };

  const handleVideoError = (error: string) => {
    console.error("Erreur de chargement vidéo:", error);
    setIsVideoLoaded(false);
  };
  
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };
  
  const getMentorAdvice = () => {
    if (!clanInfo) return "Trouve ton propre rythme pour exécuter ce mouvement.";
    
    const clanName = clanInfo.nom_clan.toLowerCase();
    
    if (clanName.includes('onotka')) {
      return "Pour devenir fort, tu dois réaliser ce mouvement lentement.";
    } else if (clanName.includes('ekloa')) {
      return "Pour être explosif, tu dois enchaîner les répétitions le plus rapidement possible.";
    } else if (clanName.includes('okwaho') || clanName.includes('okwaho')) {
      return "Trouve le juste équilibre entre la vitesse et la force, trouve le rythme qui te correspond.";
    }
    
    return "Trouve ton propre rythme pour exécuter ce mouvement.";
  };
  
  const getClanName = () => {
    return clanInfo?.nom_clan || "guerrier";
  };
  
  return (
    <View 
      style={[
        StyleSheet.absoluteFill, 
        { 
          backgroundColor: COLORS.background,
          zIndex: 9999,
          width: dimensions.width,
          height: dimensions.height,
        }
      ]}
    >
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
      
      <TouchableOpacity 
        style={[styles.closeButton, { top: 40, right: 20 }]}
        onPress={onClose}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X color="#FFFFFF" size={26} />
      </TouchableOpacity>
      
      <View style={{ height: dimensions.height * 0.4, width: dimensions.width }}>
        {exercise.videoUrl ? (
          <>
            <Video
              ref={videoRef}
              style={{ width: '100%', height: '100%' }}
              source={{ uri: exercise.videoUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={true}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onLoad={handleVideoLoad}
              onError={() => handleVideoError("Erreur de chargement de la vidéo")}
            />
            <TouchableOpacity
              style={styles.playButton}
              onPress={togglePlayback}
              activeOpacity={0.7}
            >
              {isPlaying ? (
                <Pause color="#FFFFFF" size={30} />
              ) : (
                <Play color="#FFFFFF" size={30} />
              )}
            </TouchableOpacity>
          </>
        ) : (
          <Image 
            source={{ uri: exercise.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        )}
      </View>
      
      <ScrollView 
        style={styles.detailScroll}
        contentContainerStyle={styles.detailScrollContent}
      >
        <Text style={styles.detailTitle}>{exercise.name}</Text>
        
        {/* Section Description du mouvement */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Description du mouvement</Text>
          <View style={styles.contentBlock}>
            <Text style={[styles.instructionText, { marginBottom: 0 }]}>
              {exercise.description || "Aucune description disponible pour cet exercice."}
            </Text>
          </View>
        </View>
        
        {/* Section Conseil du mentor */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Conseil du mentor</Text>
          <View style={styles.mentorContainer}>
            <View style={styles.mentorImageContainer}>
              <Image 
                source={require('@/assets/mentor-mohero.png')} 
                style={styles.mentorImage}
              />
            </View>
            <View style={styles.mentorTextContainer}>
              <Text style={styles.mentorClanText}>
                Tu es chez les {getClanName()}
              </Text>
              <Text style={styles.mentorAdviceText}>
                {getMentorAdvice()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Solution d'overlay global au niveau de l'application
const OverlayPortal = ({ children, isVisible }: OverlayPortalProps) => {
  if (!isVisible) return null;
  
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
      }}
    >
      {children}
    </View>
  );
};

// Variable globale pour suivre les détails d'exercice actuellement affichés
let activeOverlays = 0;

export default function ExerciseCard({ exercise, onUpdateProgress }: ExerciseCardProps) {
  // Protection supplémentaire contre les problèmes de données
  if (!exercise || typeof exercise !== 'object') {
    console.error('ExerciseCard: exercise invalide:', exercise);
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Erreur de données</Text>
        <Text style={styles.errorDesc}>Impossible d'afficher cet exercice</Text>
      </View>
    );
  }

  const [showDetails, setShowDetails] = useState(false);
  
  const progress = exercise.targetReps > 0 ? exercise.completedReps / exercise.targetReps : 0;
  const isCompleted = exercise.completedReps >= exercise.targetReps;
  const scale = useSharedValue(1);
  
  // Mise à jour du compteur d'overlays actifs
  useEffect(() => {
    if (showDetails) {
      activeOverlays++;
    } else if (activeOverlays > 0) {
      activeOverlays--;
    }
    
    return () => {
      if (showDetails && activeOverlays > 0) {
        activeOverlays--;
      }
    };
  }, [showDetails]);
  
  const addReps = (amount: number) => {
    // Ne pas dépasser le nombre de répétitions cibles
    const remaining = exercise.targetReps - exercise.completedReps;
    if (remaining <= 0) return; // Déjà complété
    
    // Limiter l'ajout au nombre restant
    const repsToAdd = Math.min(amount, remaining);
    
    onUpdateProgress(exercise.id, repsToAdd);
    
    // Animation
    scale.value = withSequence(
      withTiming(1.1, { duration: 150, easing: Easing.bounce }),
      withTiming(1, { duration: 150 })
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const closeDetails = () => {
    console.log("Fermeture des détails");
    setShowDetails(false);
  };
  
  const openDetails = () => {
    // Éviter d'ouvrir plusieurs overlays simultanément
    if (activeOverlays > 0) {
      console.log("Un overlay est déjà ouvert, ne rien faire");
      return;
    }
    
    console.log("Ouverture des détails");
    setShowDetails(true);
  };
  
  return (
    <>
      <Animated.View style={[styles.container, animatedStyle, isCompleted && styles.completedContainer]}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: exercise.imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
            {exercise.videoUrl && (
          <TouchableOpacity 
            style={styles.videoButton}
                onPress={openDetails}
          >
            <Play color={COLORS.text} size={20} />
          </TouchableOpacity>
            )}
        </View>
        
        <View style={styles.detailsContainer}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {exercise.name}
            </Text>
          
          <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <ProgressBar progress={progress} height={8} />
                </View>
            <Text style={styles.progressText}>
              {exercise.completedReps} / {exercise.targetReps}
            </Text>
              </View>
          </View>
          
            {!isCompleted && (
          <View style={styles.buttonsContainer}>
            <Pressable 
              style={styles.repButton}
              onPress={() => addReps(1)}
            >
              <Text style={styles.repButtonText}>+1</Text>
            </Pressable>
            
            <Pressable 
              style={styles.repButton}
              onPress={() => addReps(5)}
            >
              <Text style={styles.repButtonText}>+5</Text>
            </Pressable>
            
            <Pressable 
              style={styles.repButton}
              onPress={() => addReps(10)}
            >
              <Text style={styles.repButtonText}>+10</Text>
            </Pressable>
          </View>
            )}
            
            {isCompleted && (
              <View style={styles.completedTextContainer}>
                <Text style={styles.completedText}>Rituel gravé sur ton totem !</Text>
        </View>
            )}
          </View>
          
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Check color={COLORS.text} size={20} />
            </View>
          )}
        </View>
    </Animated.View>
      
      {/* Utilisation du OverlayPortal pour afficher en plein écran */}
      {showDetails && (
        <ExerciseDetails 
          exercise={exercise} 
          onClose={closeDetails} 
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  completedContainer: {
    backgroundColor: COLORS.card,
  },
  content: {
    flexDirection: 'row',
    height: 110,
  },
  imageContainer: {
    width: 100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  videoButton: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
  },
  completedBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
    zIndex: 10,
  },
  detailsContainer: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  title: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: 5,
  },
  progressContainer: {
    marginBottom: 5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    marginRight: 8,
  },
  progressText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    minWidth: 40,
    textAlign: 'right',
    marginBottom: 0,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  repButton: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginLeft: 0,
  },
  repButtonText: {
    ...FONTS.button,
    color: COLORS.text,
    fontSize: 14,
  },
  completedTextContainer: {
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  completedText: {
    ...FONTS.button,
    color: COLORS.success,
    fontSize: 14,
  },
  
  // Styles Overlay
  closeButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(80,80,80,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  playButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  detailScroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  detailScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  detailTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 25,
    textAlign: 'left',
    paddingHorizontal: 5,
  },
  instructionsContainer: {
    marginTop: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 24,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  errorContainer: {
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    height: 110,
  },
  errorText: {
    ...FONTS.heading,
    color: COLORS.error,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  errorDesc: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Styles pour les sections Description et Mentor
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#AAAAAA',
    marginBottom: 12,
    textAlign: 'left',
    letterSpacing: 1,
    paddingHorizontal: 5,
    textTransform: 'uppercase',
  },
  contentBlock: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  mentorContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  mentorImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  mentorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mentorTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  mentorClanText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  mentorAdviceText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
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
  ImageBackground,
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
import { useNavigation, useIsFocused } from '@react-navigation/native';

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
    <View style={styles.fullScreenContainer}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X color="#FFFFFF" size={26} />
      </TouchableOpacity>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {exercise.videoUrl ? (
          <View style={styles.headerBackground}>
            <Video
              ref={videoRef}
              style={styles.headerVideo}
              source={{ uri: exercise.videoUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={true}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onLoad={handleVideoLoad}
              onError={(error: any) => {
                console.error('Erreur détaillée de la vidéo:', error);
                handleVideoError("Erreur de chargement de la vidéo. Veuillez réessayer.");
              }}
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
            <View style={styles.headerOverlay}>
              <View style={styles.headerContent}>
                <Text style={styles.programTitle}>{exercise.name}</Text>
              </View>
            </View>
          </View>
        ) : (
          <ImageBackground 
            source={{ uri: exercise.imageUrl }}
            style={styles.headerBackground}
          >
            <View style={styles.headerOverlay}>
              <View style={styles.headerContent}>
                <Text style={styles.programTitle}>{exercise.name}</Text>
              </View>
            </View>
          </ImageBackground>
        )}
        
        <View style={styles.contentContainer}>
          {/* Section Description du mouvement */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description du mouvement</Text>
            <View style={styles.contentBlock}>
              <Text style={[styles.instructionText, { marginBottom: 0 }]}>
                {exercise.description || "Aucune description disponible pour cet exercice."}
              </Text>
            </View>
          </View>
          
          {/* Section Conseil du mentor avec couleur du clan */}
          <Text style={styles.sectionTitle}>Conseil du mentor</Text>
          <View style={styles.mentorSection}>
            <View style={styles.mentorContent}>
              <Image 
                source={require('@/assets/mentor-mohero.png')} 
                style={styles.mentorAvatar}
                resizeMode="contain"
              />
              <View style={styles.mentorTextContainer}>
                <Text style={[styles.clanText, { color: getClanColor(clanInfo?.nom_clan) }]}>
                  Tu es un {clanInfo?.nom_clan || 'guerrier'}
                </Text>
                <Text style={styles.mentorAdvice}>{getMentorAdvice()}</Text>
              </View>
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [clanInfo, setClanInfo] = useState<{ nom_clan: string } | null>(null);
  
  const progress = exercise.targetReps > 0 ? exercise.completedReps / exercise.targetReps : 0;
  const isCompleted = exercise.completedReps >= exercise.targetReps;
  const scale = useSharedValue(1);
  
  // Récupérer les informations du clan à partir de l'ID
  useEffect(() => {
    const fetchClanInfo = async () => {
      if (user?.clanId) {
        try {
          const { data, error } = await supabase
            .from('clans')
            .select('nom_clan')
            .eq('id', user.clanId)
            .single();
            
          if (error) {
            console.error('Error fetching clan info:', error);
          } else if (data) {
            setClanInfo(data);
          }
        } catch (err) {
          console.error('Exception while fetching clan info:', err);
        }
      }
    };
    
    fetchClanInfo();
  }, [user]);

  // Fermer la modale lorsque l'utilisateur quitte l'écran
  useEffect(() => {
    if (!isFocused && showDetails) {
      console.log("L'écran n'est plus focus, fermeture de la modale");
      setShowDetails(false);
    }
  }, [isFocused]);
  
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
  
  // Gestion de la vidéo
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
  
  const getClanColor = (clanName?: string): string => {
    if (!clanName) return COLORS.primary;
    
    const lowerClanName = clanName.toLowerCase();
    if (lowerClanName.includes('onotka')) {
      return '#FF4B4B'; // Rouge pour Onotka
    } else if (lowerClanName.includes('ekloa')) {
      return '#4CAF50'; // Vert pour Ekloa
    } else if (lowerClanName.includes('okwaho')) {
      return '#2196F3'; // Bleu pour Okwaho
    }
    return COLORS.primary;
  };
  
  return (
    <>
      <Animated.View style={[styles.container, animatedStyle, isCompleted && styles.completedContainer]}>
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={openDetails}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: exercise.imageUrl }} 
              style={styles.image} 
              resizeMode="cover"
            />
              {exercise.videoUrl && (
                <View style={styles.videoIndicator}>
              <Play color={COLORS.text} size={20} />
                </View>
              )}
          </TouchableOpacity>
        
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
      
      {showDetails && (
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeDetails}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X color="#FFFFFF" size={26} />
          </TouchableOpacity>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.videoContainer}>
              {exercise.videoUrl ? (
                <>
                  <Video
                    ref={videoRef}
                    style={styles.modalVideo}
                    source={{ uri: exercise.videoUrl }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay={true}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                    onLoad={handleVideoLoad}
                    onError={(error: any) => {
                      console.error('Erreur détaillée de la vidéo:', error);
                      handleVideoError("Erreur de chargement de la vidéo. Veuillez réessayer.");
                    }}
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
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.exerciseTitle}>{exercise.name}</Text>
              
              {/* Section Description du mouvement */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Description du mouvement</Text>
                <View style={styles.contentBlock}>
                  <Text style={[styles.instructionText, { marginBottom: 0 }]}>
                    {exercise.description || "Aucune description disponible pour cet exercice."}
                  </Text>
                </View>
              </View>
              
              {/* Section Conseil du mentor avec couleur du clan */}
              <Text style={styles.sectionTitle}>Conseil du mentor</Text>
              <View style={styles.mentorSection}>
                <View style={styles.mentorContent}>
                  <Image 
                    source={require('@/assets/mentor-mohero.png')} 
                    style={styles.mentorAvatar}
                    resizeMode="contain"
                  />
                  <View style={styles.mentorTextContainer}>
                    <Text style={[styles.clanText, { color: getClanColor(clanInfo?.nom_clan) }]}>
                      Tu es un {clanInfo?.nom_clan || 'guerrier'}
                    </Text>
                    <Text style={styles.mentorAdvice}>{getMentorAdvice()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
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
  headerBackground: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  headerVideo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  programTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  contentContainer: {
    padding: SPACING.lg,
    flex: 1,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.subheading,
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: SPACING.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contentBlock: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  instructionText: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
  },
  quoteSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  quoteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorImage: {
    width: 80,
    height: 80,
    marginRight: SPACING.md,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quote: {
    ...FONTS.body,
    color: COLORS.text,
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    fontStyle: 'italic',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    zIndex: 99999,
    elevation: 99999,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(80,80,80,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000,
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
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 99999,
    elevation: 99999,
  },
  modalScroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoContainer: {
    height: 250,
    position: 'relative',
    backgroundColor: '#000000',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalContent: {
    padding: SPACING.lg,
    flex: 1,
  },
  exerciseTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.lg,
  },
  mentorSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  mentorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorAvatar: {
    width: 80,
    height: 80,
    marginRight: SPACING.md,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  mentorTextContainer: {
    flex: 1,
  },
  clanText: {
    ...FONTS.subheading,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  mentorAdvice: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 16,
    fontStyle: 'italic',
  },
});
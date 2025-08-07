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
  Modal,
  PixelRatio,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';

// Fonction pour calculer des tailles responsives basées sur la densité de pixels
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();
const deviceScale = screenWidth / 375; // Base sur iPhone X (375px de largeur)

const normalize = (size: number) => {
  // Version plus conservative qui garde les textes lisibles
  const basePixelRatio = 2.6; // Pixel ratio du Pixel 8 Pro comme référence
  const densityScale = Math.min(basePixelRatio / pixelRatio, 1.1); // Limiter la réduction
  
  // Scale plus doux
  let newSize = size * deviceScale * densityScale;
  
  // Limiter les variations pour garder la lisibilité
  const minSize = size * 0.9; // Moins de réduction
  const maxSize = size * 1.2; // Moins d'agrandissement
  
  return Math.max(minSize, Math.min(maxSize, newSize));
};
import ProgressBar from './ProgressBar';
import Timer from './Timer';
import { Play, X, Check, Pause, Clock, RotateCcw } from 'lucide-react-native';
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
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdateProgress: (exerciseId: string, reps: number) => void;
  onPressDetails?: (exercise: Exercise) => void;
}

interface ExerciseDetailsProps {
  exercise: Exercise;
  onClose: () => void;
}

interface OverlayPortalProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export function ExerciseDetails({ exercise, onClose }: ExerciseDetailsProps) {
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
  
  const getClanColor = (clanName?: string): string => {
    if (!clanName) return COLORS.primary;
    
    const lowerClanName = clanName.toLowerCase();
    if (lowerClanName.includes('onotka')) {
      return COLORS.clan.onotka;
    } else if (lowerClanName.includes('ekloa')) {
      return COLORS.clan.ekloa;
    } else if (lowerClanName.includes('okwaho')) {
      return COLORS.clan.okwaho;
    }
    return COLORS.primary;
  };
  
  return (
    <View style={styles.modalContainer}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X color="#FFFFFF" size={26} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.modalScrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {exercise.videoUrl ? (
          <View style={styles.headerBackground}>
            <Video
              ref={videoRef}
              style={styles.headerVideo}
              source={{ uri: exercise.videoUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
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
          </View>
        ) : (
          <ImageBackground 
            source={{ uri: exercise.imageUrl }}
            style={styles.headerBackground}
          />
        )}
        
        <View style={styles.contentContainer}>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>

          {/* Section Description du mouvement */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>DESCRIPTION DU MOUVEMENT</Text>
            <View style={styles.contentBlock}>
              <Text style={[styles.instructionText, { marginBottom: 0 }]}>
                {exercise.description || "Aucune description disponible pour cet exercice."}
              </Text>
            </View>
          </View>
          
          {/* Section Conseil du mentor avec couleur du clan */}
          <Text style={styles.sectionTitle}>CONSEIL DU MENTOR</Text>
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

export default function ExerciseCard({ exercise, onUpdateProgress, onPressDetails }: ExerciseCardProps) {
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

  // États pour la modal chronomètre
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // États pour la phase de préparation
  const [isPreparationPhase, setIsPreparationPhase] = useState(true);
  const [preparationSeconds, setPreparationSeconds] = useState(10);

  // Fonction pour formater le temps en minutes:secondes
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  // Fonction pour formater le texte de progression
  const getProgressText = () => {
    // Toujours afficher en nombre de répétitions, même pour les exercices de durée
    return `${exercise.completedReps} / ${exercise.targetReps}`;
  };

  // Fonctions pour le chronomètre
  const openTimerModal = () => {
    setShowTimerModal(true);
    setTimerSeconds(30);
    setPreparationSeconds(10);
    setIsPreparationPhase(true);
    setIsTimerRunning(false);
    setTimerCompleted(false);
  };

  const closeTimerModal = () => {
    setShowTimerModal(false);
    pauseTimer();
    resetTimer();
  };

  const startTimer = () => {
    if (!timerCompleted) {
      setIsTimerRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(30);
    setPreparationSeconds(10);
    setIsPreparationPhase(true);
    setTimerCompleted(false);
  };

  const playPreparationSound = async () => {
    try {
      // Son d'alerte pour le passage préparation → exercice
      // Tu pourras remplacer par le son que tu veux
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/music/bamayedrum.mp3')
      );
      await sound.setVolumeAsync(0.5);
      await sound.playAsync();
      
      setTimeout(() => {
        sound.unloadAsync();
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la lecture du son de préparation:', error);
    }
  };

  const playTimerEndSound = async () => {
    try {
      // Son de fin d'exercice
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/music/bamayedrum.mp3')
      );
      await sound.setVolumeAsync(0.3);
      await sound.playAsync();
      
      setTimeout(() => {
        sound.unloadAsync();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la lecture du son de fin:', error);
    }
  };

  // Fonction pour extraire la durée depuis le nom de l'exercice
  const extractDurationFromName = (name: string): number => {
    // Chercher des patterns comme "30sec", "45s", "1min30", etc.
    const secMatch = name.match(/(\d+)sec/i);
    if (secMatch) {
      return parseInt(secMatch[1]);
    }
    
    const sMatch = name.match(/(\d+)s/i);
    if (sMatch) {
      return parseInt(sMatch[1]);
    }
    
    const minMatch = name.match(/(\d+)min/i);
    if (minMatch) {
      return parseInt(minMatch[1]) * 60;
    }
    
    // Valeur par défaut pour les exercices de durée
    return 30;
  };

  // Debug log pour vérifier si isDurationBased fonctionne
  console.log('ExerciseCard - Exercice:', exercise.name, 'isDurationBased:', exercise.isDurationBased);
  console.log('ExerciseCard - isCompleted:', isCompleted, 'targetReps:', exercise.targetReps, 'completedReps:', exercise.completedReps);
  
  if (exercise.isDurationBased) {
    const extractedDuration = extractDurationFromName(exercise.name);
    console.log('ExerciseCard - Durée extraite:', extractedDuration, 'secondes');
  }
  
  console.log('ExerciseCard - Conditions pour timer:', {
    notCompleted: !isCompleted,
    isDurationBased: exercise.isDurationBased,
    shouldShowTimer: !isCompleted && exercise.isDurationBased
  });
  
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

  // Effet pour gérer le décompte du chronomètre
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        if (isPreparationPhase) {
          // Phase de préparation (10s)
          setPreparationSeconds((prev) => {
            if (prev <= 1) {
              // Fin de la préparation → passage à l'exercice
              playPreparationSound();
              setIsPreparationPhase(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Phase d'exercice (30s)
          setTimerSeconds((prev) => {
            if (prev <= 1) {
              setIsTimerRunning(false);
              setTimerCompleted(true);
              // Jouer le son de fin
              playTimerEndSound();
              // Ajouter une répétition
              if (exercise.completedReps < exercise.targetReps) {
                onUpdateProgress(exercise.id, 1);
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, isPreparationPhase]);

  // Nettoyer les intervalles à la destruction du composant
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
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
    if (onPressDetails) {
      onPressDetails(exercise);
    }
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
      return COLORS.clan.onotka;
    } else if (lowerClanName.includes('ekloa')) {
      return COLORS.clan.ekloa;
    } else if (lowerClanName.includes('okwaho')) {
      return COLORS.clan.okwaho;
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
              {getProgressText()}
            </Text>
              </View>
          </View>
          
            {!isCompleted && (
          <View style={styles.buttonsRow}>
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
            
            {exercise.isDurationBased && (
              <TouchableOpacity 
                style={styles.chronoIconInline}
                onPress={openTimerModal}
              >
                <Clock color={COLORS.text} size={16} />
              </TouchableOpacity>
            )}
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
        <View style={styles.modalOverlay}>
          <StatusBar backgroundColor="black" barStyle="light-content" />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeDetails}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X color="#FFFFFF" size={26} />
          </TouchableOpacity>
          <ScrollView style={{ flex: 1 }}>
            <View style={styles.videoContainer}>
              {exercise.videoUrl ? (
                <>
                  <Video
                    ref={videoRef}
                    style={styles.modalVideo}
                    source={{ uri: exercise.videoUrl }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.CONTAIN}
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
                  style={styles.modalVideo}
                  resizeMode="cover"
                />
              )}
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.exerciseTitle}>{exercise.name}</Text>
              {/* Section Description du mouvement */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>DESCRIPTION DU MOUVEMENT</Text>
                <View style={styles.contentBlock}>
                  <Text style={[styles.instructionText, { marginBottom: 0 }]}>
                    {exercise.description || "Aucune description disponible pour cet exercice."}
                  </Text>
                </View>
              </View>
              {/* Section Conseil du mentor */}
              <Text style={styles.sectionTitle}>CONSEIL DU MENTOR</Text>
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
      
      {/* Modal Chronomètre */}
      {showTimerModal && (
        <View style={styles.timerModalOverlay}>
          <TouchableOpacity 
            style={styles.timerCloseButton}
            onPress={closeTimerModal}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X color="#FFFFFF" size={26} />
          </TouchableOpacity>

          <View style={styles.timerModalContent}>
            {/* Texte dynamique au-dessus du chrono */}
            <Text style={styles.timerInstructionText}>
              {timerCompleted 
                ? 'Bravo !' 
                : isPreparationPhase 
                  ? 'Mets-toi en position' 
                  : 'C\'est parti !'}
            </Text>

            {/* Cercle de progression avec temps */}
            <View style={styles.timerCircleContainer}>
              <View style={styles.timerCircle}>
                {/* Cercle de base vert complet */}
                <View style={styles.timerBaseCircle} />
                
                {/* Progress bar violette qui se remplit */}
                <View style={styles.progressWrapper}>
                  <View style={[
                    styles.leftHalfCircle,
                    {
                      transform: [{ 
                        rotate: `${isPreparationPhase ? 0 : Math.min(180, ((30 - timerSeconds) / 30) * 360)}deg` 
                      }]
                    }
                  ]} />
                  
                  <View style={[
                    styles.rightHalfCircle,
                    {
                      transform: [{ 
                        rotate: `${isPreparationPhase ? 0 : Math.max(0, ((30 - timerSeconds) / 30) * 360 - 180)}deg` 
                      }]
                    }
                  ]} />
                </View>
                
                <View style={styles.timerInnerCircle}>
                  <Text style={styles.timerText}>
                    {timerCompleted 
                      ? 'Terminé !' 
                      : isPreparationPhase 
                        ? `${preparationSeconds}s` 
                        : `${timerSeconds}s`}
                  </Text>
                  {!timerCompleted && (
                    <Text style={styles.timerPhaseText}>
                      {isPreparationPhase ? 'préparation' : 'exercice'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Contrôles */}
            <View style={styles.timerControls}>
              {!timerCompleted ? (
                <>
                  <TouchableOpacity 
                    style={styles.timerControlButton}
                    onPress={isTimerRunning ? pauseTimer : startTimer}
                    disabled={timerSeconds === 0}
                  >
                    {isTimerRunning ? (
                      <Pause color={COLORS.text} size={24} />
                    ) : (
                      <Play color={COLORS.text} size={24} />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.timerControlButton}
                    onPress={resetTimer}
                  >
                    <RotateCcw color={COLORS.text} size={24} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.timerControlButton, styles.timerResetButton]}
                  onPress={resetTimer}
                >
                  <RotateCcw color={COLORS.text} size={24} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    marginTop: 0, // S'assurer qu'il n'y a pas de marge en haut pour la modal
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121212',
    zIndex: 999999,
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 999999,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Assez d'espace en bas pour scroller et voir tout le contenu
  },
  headerBackground: {
    height: 300,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerVideo: {
    width: '100%',
    height: '100%',
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
    padding: normalize(SPACING.md), // Réduit le padding et rendu responsive
    paddingTop: normalize(SPACING.sm), // Un peu de padding en haut maintenant que le scroll fonctionne
    flex: 1,
    backgroundColor: '#121212',
  },
  sectionContainer: {
    marginBottom: normalize(SPACING.lg), // Réduit la marge et rendu responsive
  },
  sectionTitle: {
    ...FONTS.subheading,
    color: COLORS.textSecondary,
    fontSize: normalize(12), // Réduit de 14 à 12 et rendu responsive
    marginBottom: normalize(SPACING.sm), // Réduit la marge et rendu responsive
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contentBlock: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  instructionText: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: normalize(15), // Réduit de 16 à 15 et rendu responsive
    lineHeight: normalize(22), // Ajusté proportionnellement
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
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000000,
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
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  chronoIconInline: {
    backgroundColor: '#228B22', // Vert feuille jungle au lieu du vert basique
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 9999,
    elevation: 99,
  },
  videoContainer: {
    height: 250,
    width: '100%',
    backgroundColor: '#121212',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalContent: {
    padding: SPACING.lg,
  },
  exerciseTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: normalize(22), // Réduit de 24 à 22 et rendu responsive
    marginBottom: normalize(SPACING.md), // Encore moins de marge en bas
    marginTop: normalize(SPACING.xs), // Un peu de marge en haut pour aérer
  },
  mentorSection: {
    backgroundColor: COLORS.cardSecondary,
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
    fontSize: normalize(15), // Réduit de 16 à 15 et rendu responsive
    marginBottom: SPACING.sm,
  },
  mentorAdvice: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: normalize(14), // Réduit de 16 à 14 et rendu responsive
    fontStyle: 'italic',
    lineHeight: normalize(20), // Ajout d'une hauteur de ligne
  },
  // Styles pour la modal chronomètre
  timerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121212',
    zIndex: 9999,
    elevation: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModalContent: {
    backgroundColor: 'transparent', // Transparent pour éviter le bloc dans bloc
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingTop: 180, // Descendu encore plus (de 140 à 180) pour laisser place au texte
    paddingBottom: 120, // Plus d'espace en bas aussi
  },
  timerInstructionText: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  timerCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000000,
  },
  timerCircleContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  timerCircle: {
    width: 340, // Agrandi de 280 à 340
    height: 340, // Agrandi de 280 à 340
    borderRadius: 170, // 340/2
    backgroundColor: COLORS.cardSecondary,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBaseCircle: {
    position: 'absolute', 
    width: 340, // Agrandi de 280 à 340
    height: 340, // Agrandi de 280 à 340
    borderRadius: 170, // 340/2
    borderWidth: 14, // Agrandi de 12 à 14
    borderColor: '#228B22', // Vert feuille jungle
  },
  progressWrapper: {
    position: 'absolute',
    width: 340, // Agrandi de 280 à 340
    height: 340, // Agrandi de 280 à 340
  },
  leftHalfCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 170, // Agrandi de 140 à 170
    height: 340, // Agrandi de 280 à 340
    borderTopLeftRadius: 170, // Agrandi de 140 à 170
    borderBottomLeftRadius: 170, // Agrandi de 140 à 170
    borderLeftWidth: 14, // Agrandi de 12 à 14
    borderTopWidth: 14, // Agrandi de 12 à 14
    borderBottomWidth: 14, // Agrandi de 12 à 14
    borderLeftColor: '#8c6ff7', // Couleur violette personnalisée
    borderTopColor: '#8c6ff7', // Couleur violette personnalisée
    borderBottomColor: '#8c6ff7', // Couleur violette personnalisée
    transform: [{ rotate: '-90deg' }],
    transformOrigin: '170px 170px', // Ajusté
  },
  rightHalfCircle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 170, // Agrandi de 140 à 170
    height: 340, // Agrandi de 280 à 340
    borderTopRightRadius: 170, // Agrandi de 140 à 170
    borderBottomRightRadius: 170, // Agrandi de 140 à 170
    borderRightWidth: 14, // Agrandi de 12 à 14
    borderTopWidth: 14, // Agrandi de 12 à 14
    borderBottomWidth: 14, // Agrandi de 12 à 14
    borderRightColor: '#8c6ff7', // Couleur violette personnalisée
    borderTopColor: '#8c6ff7', // Couleur violette personnalisée
    borderBottomColor: '#8c6ff7', // Couleur violette personnalisée
    transform: [{ rotate: '-90deg' }],
    transformOrigin: '0px 170px', // Ajusté
  },
  timerInnerCircle: {
    width: 260, // Agrandi de 220 à 260
    height: 260, // Agrandi de 220 à 260
    borderRadius: 130, // 260/2
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Assure que rien ne dépasse
  },
  timerText: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 50, // Réduit de 54 à 50 pour éviter la troncature
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 56, // Contrôle de la hauteur de ligne
    includeFontPadding: false, // Pour Android, évite le padding supplémentaire
  },
  timerPhaseText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.xs,
    opacity: 0.8,
  },
  timerControls: {
    flexDirection: 'row',
    gap: SPACING.xl, // Plus d'espace entre les boutons
    marginTop: SPACING.xl,
  },
  timerControlButton: {
    backgroundColor: '#8c6ff7', // Couleur violette personnalisée
    padding: SPACING.lg, // Plus de padding
    borderRadius: BORDER_RADIUS.round,
    width: 80, // Agrandi de 60 à 80
    height: 80, // Agrandi de 60 à 80
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerResetButton: {
    backgroundColor: '#16a34a', // Vert
  },
});
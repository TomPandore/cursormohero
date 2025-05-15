import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity,
  Pressable,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import ProgressBar from './ProgressBar';
import { Play, X, Check } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { Exercise } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdateProgress: (exerciseId: string, reps: number) => void;
}

export default function ExerciseCard({ exercise, onUpdateProgress }: ExerciseCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const progress = exercise.targetReps > 0 ? exercise.completedReps / exercise.targetReps : 0;
  const isCompleted = exercise.completedReps >= exercise.targetReps;
  const scale = useSharedValue(1);
  
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
  
  return (
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
              onPress={() => setShowVideo(true)}
            >
              <Play color={COLORS.text} size={20} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.description}>{exercise.description}</Text>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {exercise.completedReps} / {exercise.targetReps}
            </Text>
            <ProgressBar progress={progress} height={8} />
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
      
      <Modal
        visible={showVideo}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowVideo(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowVideo(false)}
              style={styles.closeButton}
            >
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{exercise.name}</Text>
          </View>
          
          <WebView 
            source={{ uri: exercise.videoUrl || 'about:blank' }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            androidLayerType={'hardware'}
            mixedContentMode="always"
            originWhitelist={['*']}
            startInLoadingState={true}
            onLoadStart={() => console.log('Début chargement vidéo:', exercise.videoUrl)}
            onLoad={() => console.log('Vidéo chargée avec succès:', exercise.videoUrl)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('Erreur WebView:', nativeEvent);
            }}
            renderError={(errorDomain, errorCode, errorDesc) => (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Impossible de charger la vidéo.
                </Text>
                <Text style={styles.errorDesc}>
                  Erreur: {errorDomain} ({errorCode}): {errorDesc}
                </Text>
                <Text style={styles.errorUrl}>URL: {exercise.videoUrl}</Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </Animated.View>
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
    minHeight: 150,
  },
  imageContainer: {
    width: 120,
    position: 'relative',
    height: '100%',
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
  },
  title: {
    ...FONTS.subheading,
    color: COLORS.text,
  },
  description: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  repButton: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
  },
  repButtonText: {
    ...FONTS.button,
    color: COLORS.text,
    fontSize: 14,
  },
  completedTextContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  },
  completedText: {
    ...FONTS.button,
    color: COLORS.success,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    marginRight: SPACING.md,
  },
  modalTitle: {
    ...FONTS.heading,
    color: COLORS.text,
  },
  webView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    ...FONTS.heading,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  errorDesc: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorUrl: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
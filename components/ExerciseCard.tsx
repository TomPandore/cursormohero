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
import { Play, X } from 'lucide-react-native';
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
  const progress = exercise.completedReps / exercise.targetReps;
  const scale = useSharedValue(1);
  
  const addReps = (amount: number) => {
    onUpdateProgress(exercise.id, amount);
    
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
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: exercise.imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.videoButton}
            onPress={() => setShowVideo(true)}
          >
            <Play color={COLORS.text} size={20} />
          </TouchableOpacity>
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
        </View>
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
            source={{ uri: exercise.videoUrl }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
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
  },
  content: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoButton: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
  },
  detailsContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  title: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
});
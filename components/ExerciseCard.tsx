import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdateProgress: (exerciseId: string, reps: number) => void;
}

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

  const [modalVisible, setModalVisible] = useState(false);
  
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
              onPress={() => setModalVisible(true)}
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

      {modalVisible && (
        <View 
          style={{
            position: 'absolute',
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            backgroundColor: 'black',
            zIndex: 1000,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 0,
            margin: 0,
          }}
        >
          <Pressable 
            style={{
              position: 'absolute',
              top: 40,
              left: 20,
              zIndex: 1001,
              padding: 5,
            }}
            onPress={() => setModalVisible(false)}
          >
            <X color="white" size={30} />
          </Pressable>
          
          <Image 
            source={{ uri: exercise.imageUrl }} 
            style={{
              width: '100%',
              height: '40%',
              resizeMode: 'cover',
            }}
          />
          
          <ScrollView style={{backgroundColor: 'black', padding: 20}}>
            <Text style={{
              color: 'white',
              fontSize: 32,
              fontWeight: 'bold',
              marginVertical: 20,
            }}>
              {exercise.name}
            </Text>
            
            <View style={{
              marginBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#333',
              paddingBottom: 20,
              flexDirection: 'row',
            }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#333',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15,
              }}>
                <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>1</Text>
              </View>
              <Text style={{
                color: 'white',
                fontSize: 16,
                flex: 1,
                lineHeight: 24,
              }}>
                Placez vos mains sur la surface surélevée à la largeur des épaules
              </Text>
            </View>
            
            <View style={{
              marginBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#333',
              paddingBottom: 20,
              flexDirection: 'row',
            }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#333',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15,
              }}>
                <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>2</Text>
              </View>
              <Text style={{
                color: 'white',
                fontSize: 16,
                flex: 1,
                lineHeight: 24,
              }}>
                Tout en inspirant, descendez votre corps en pliant vos coudes à 90 degrés
              </Text>
            </View>
            
            <View style={{
              marginBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#333',
              paddingBottom: 20,
              flexDirection: 'row',
            }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#333',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15,
              }}>
                <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>3</Text>
              </View>
              <Text style={{
                color: 'white',
                fontSize: 16,
                flex: 1,
                lineHeight: 24,
              }}>
                Une fois au point le plus bas, faites une pause puis repoussez votre corps vers le haut
              </Text>
            </View>
          </ScrollView>
        </View>
      )}
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
});
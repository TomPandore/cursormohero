import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { X, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  image?: any; // Image à superposer
  showOverlay?: boolean; // Si on affiche l'overlay sombre
}

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans tes rituels !',
    description: 'Ici tu retrouves tous les exercices que tu dois accomplir dans la journée.',
    showOverlay: true, // Étape 1 : overlay avec opacité réduite, pas d'image
  },
  {
    id: 'flexibility',
    title: 'Liberté totale',
    description: 'Tu peux réaliser les exercices dans l\'ordre que tu veux, quand tu veux ! Pas besoin de tout faire d\'un coup.',
    image: require('@/assets/images/tutoriels/didacticiel-step2.png'),
    showOverlay: false,
  },
  {
    id: 'natural_movement',
    title: 'Mouvements naturels',
    description: 'Pas besoin d\'échauffement ! Nos mouvements sont fonctionnels et basés sur des gestes naturels.',
    image: require('@/assets/images/tutoriels/didacticiel-step3.webp'),
    showOverlay: false,
  },
  {
    id: 'buttons',
    title: 'Suivi de progression',
    description: 'Utilise les boutons +1, +5, +10 pour indiquer combien de répétitions tu as fait. Tu as fait 10 pompes ? Clique +10 !',
    image: require('@/assets/images/tutoriels/didacticiel-step4.png'),
    showOverlay: false,
  },
];

export default function OnboardingTutorial({ visible, onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const currentStepData = tutorialSteps[currentStep];

  useEffect(() => {
    if (visible) {
      // Animation d'entrée - card seulement
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const handleSkip = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSkip();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgba(0,0,0,0.4)" barStyle="light-content" />
      
      {/* Overlay sombre (seulement pour la première étape) */}
      {currentStepData.showOverlay && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            }
          ]}
        />
      )}

      {/* Image superposée (étapes 2, 3, 4) */}
      {currentStepData.image && (
        <Animated.View 
          style={[
            styles.imageOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Image 
            source={currentStepData.image}
            style={styles.tutorialImage}
            resizeMode="cover"
          />
        </Animated.View>
      )}

      {/* Contenu du tutorial */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* Bouton Skip */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <X color={COLORS.text} size={24} />
        </TouchableOpacity>

        {/* Card principale avec mentor */}
        <View style={styles.tutorialCard}>
          {/* Bulle de dialogue - couche de fond */}
          <View style={styles.dialogueBubble}>
            <Text style={styles.title}>
              {currentStepData.title}
            </Text>
            
            <Text style={styles.description}>
              {currentStepData.description}
            </Text>

            {/* Boutons de navigation */}
            <View style={styles.navigationContainer}>
              <View style={styles.dotsContainer}>
                {tutorialSteps.map((_, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.dot,
                      index === currentStep && styles.activeDot
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep < tutorialSteps.length - 1 ? 'Suivant' : 'Compris'}
                </Text>
                <ChevronRight color={COLORS.text} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar du mentor - couche par-dessus (position absolute) */}
          
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Opacité réduite pour la première étape
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tutorialImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
  },
  tutorialCard: {
    position: 'relative',
    alignItems: 'center',
  },
  mentorContainer: {
    position: 'absolute',
    left: -SPACING.lg, // Compense le padding du contentContainer
    bottom: -SPACING.xl * 2, // Compense le paddingBottom du contentContainer
    zIndex: 10,
    elevation: 20,
  },
  mentorAvatar: {
    width: 160,
    height: 220,
  },
  dialogueBubble: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    paddingLeft: 85, // Encore un peu plus proche
    paddingRight: SPACING.lg,
    justifyContent: 'center', // Centre le contenu verticalement
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(34, 139, 34, 0.2)', // Bordure verte subtle
    width: '100%',
    minHeight: 40, // Dégagé les 3/4 de la hauteur - beaucoup plus compact
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 22, // Légèrement plus petit pour un meilleur équilibre
    fontWeight: 'bold',
    textAlign: 'left', // Aligné à gauche pour une meilleure lecture
    marginBottom: SPACING.sm, // Moins d'espace maintenant qu'il n'y a plus de stepCounter
    width: '100%',
  },
  description: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 15, // Légèrement plus petit
    textAlign: 'left', // Aligné à gauche
    lineHeight: 22,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  navigationContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  activeDot: {
    backgroundColor: '#228B22', // Vert jungle
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#228B22', // Vert jungle
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    shadowColor: '#228B22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    ...FONTS.button,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
}); 

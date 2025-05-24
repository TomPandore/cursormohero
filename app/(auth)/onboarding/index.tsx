import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Utilisons temporairement des images existantes pour l'onboarding
const slides = [
  {
    id: '1',
    title: 'MoHero, un héritage oublié',
    content: 'Avant les salles, avant les chronos…\nIl y avait Mohero. Une tribu forgée par l\'instinct, le feu, la terre. Ce n\'était pas du sport. C\'était une voie. Aujourd\'hui cette voie, c\'est la tienne.',
    image: require('@/assets/slide1.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '2',
    title: 'Bouge comme tu vis',
    content: 'Ici, pas de séances à cocher. Chaque jour, tu t\'éveilles par le mouvement. Chaque geste est un rite. Chaque effort est sacré. Ton corps doit être prêt. À tout. Toujours.',
    image: require('@/assets/slide2.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '3',
    title: 'Trace ta voie',
    content: 'Ce que tu fais ici ne disparaîtra jamais. Chaque effort grave une empreinte dans ton Totem. Engage-toi. Trace ta voie. Et n\'oublie pas… le ciel n\'est qu\'un début.',
    image: require('@/assets/slide4.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '4',
    title: 'L\'initiation',
    content: 'Avant toute chose, découvre les rituels MoHero. Accomplis ton premier jour.\nCe n\'est qu\'après ce rite que tu pourras embrasser ta véritable voie.',    
    image: require('@/assets/initiation_scene.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const goToNextSlide = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < slides.length && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      // Navigate to initiation program instead of clan selection
      router.replace('/(auth)/onboarding/initiation');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((item, index) => (
          <View key={item.id} style={styles.slideContainer}>
            <ImageBackground 
              source={item.image} 
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                style={styles.gradientOverlay}
              >
                <View style={styles.contentContainer}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.content}>{item.content}</Text>
                  
                  {index < slides.length - 1 ? (
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={goToNextSlide}
                    >
                      <ChevronRight color={COLORS.text} size={24} />
                    </TouchableOpacity>
                  ) : (
                    <Button
                      title="Découvrir l'initiation"
                      onPress={handleComplete}
                      style={styles.startButton}
                      isLoading={isLoading}
                    />
                  )}
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>

      <View style={styles.paginationContainer}>
        {slides.map((_, i) => (
          <View 
            key={`dot-${i}`} 
            style={[
              styles.dot,
              currentIndex === i ? styles.activeDot : null
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  slideContainer: {
    width,
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 28,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  content: {
    ...FONTS.body,
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  nextButton: {
    backgroundColor: COLORS.primary + '80',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    minWidth: 200,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: SPACING.xl,
    width: '100%',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 16,
    backgroundColor: COLORS.text,
  },
});
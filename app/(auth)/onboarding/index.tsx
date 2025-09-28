import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ImageSourcePropType
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

interface OnboardingSlide {
  id: string;
  title: string;
  content: string;
  image: ImageSourcePropType;
  background: string;
}

const FEMALE_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bouge avec ta vie !',
    content:
      "Entre le travail, les enfants, la maison... le sport, c'est souvent la première chose qu'on laisse tomber. Pas ici. MoHero s'adapte à ton rythme, pas l'inverse.",
    image: require('@/assets/slide1-vf.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '2',
    title: "L'héritage Mohero",
    content:
      "Avant les salles de sport et les programmes stricts, nos ancêtres bougeaient par instinct. Elles écoutaient leur corps, s'adaptaient à leur environnement.",
    image: require('@/assets/slide2-vf.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '3',
    title: 'Trace ta voie',
    content:
      "C'est cette voie simple, naturelle et puissante que MoHero t'invite à redécouvrir. Deviens l'héroïne de ta vie et rejoins la tribu MoHero.",
    image: require('@/assets/slide3-vf.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '4',
    title: "Réveil ton instinct",
    content:
      "Tu es à la porte de la tribu. Le premier pas est le plus sacré. Laisse derrière toi le bruit du monde et écoute le rythme de tes ancêtres. Ton initiation commence maintenant.",
    image: require('@/assets/slide5-vf.webp'),
    background: 'rgba(0,0,0,0.7)'
  }
];

const MALE_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bouge avec ta vie !',
    content:
      "Entre le travail, les défis, la maison... le sport est souvent la première chose qu'on laisse tomber. Pas ici. MoHero s'adapte à ton rythme, pas l'inverse.",
    image: require('@/assets/slide01-vh.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '2',
    title: "L'héritage Mohero",
    content:
      "Avant les salles de sport et les programmes stricts, nos ancêtres bougeaient par instinct. Ils écoutaient leur corps, s'adaptaient à leur environnement.",
    image: require('@/assets/slide02-vh.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '3',
    title: 'Trace ta voie',
    content:
      "C'est cette voie simple, naturelle et puissante que MoHero t'invite à redécouvrir. Deviens le héros de ta vie et rejoins la tribu MoHero.",
    image: require('@/assets/slide03-vh.webp'),
    background: 'rgba(0,0,0,0.7)'
  },
  {
    id: '4',
    title: "L'initiation",
    content:
      "Tu es à la porte de la tribu. Le premier pas est le plus sacré. Laisse derrière toi le bruit du monde et écoute le rythme de tes ancêtres. Ton initiation commence maintenant.",
    image: require('@/assets/slide04-vh.webp'),
    background: 'rgba(0,0,0,0.7)'
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const slides = useMemo<OnboardingSlide[]>(() => {
    if (user?.gender === 'homme') {
      return MALE_SLIDES;
    }

    if (user?.gender === 'femme') {
      return FEMALE_SLIDES;
    }

    return FEMALE_SLIDES;
  }, [user?.gender]);

  useEffect(() => {
    setCurrentIndex(0);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [slides]);

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
                colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
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

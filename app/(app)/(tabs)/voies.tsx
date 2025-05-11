import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING } from '@/constants/Layout';
import ProgramCard from '@/components/ProgramCard';
import { supabase } from '@/lib/supabase';
import { useProgram } from '@/context/ProgramContext';

// Type brut depuis Supabase
interface Program {
  id: string;
  nom: string;
  description: string;
  image_url: string;
  duree_jours: number;
  type: 'Découverte' | 'Premium';
  tags: string[];
}

// Type attendu par la carte
interface ProgramCardModel {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
  focus: string[];
  category: 'discovery' | 'premium';
  details: {
    benefits: string[];
    phases: {
      title: string;
      description: string;
    }[];
  };
}

export default function PathsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { currentProgram, selectProgram } = useProgram();
  
  useEffect(() => {
    fetchPrograms();
    
    // Log détaillé du programme courant
    console.log('Programme courant au chargement:', JSON.stringify(currentProgram));
  }, []);

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Récupération des programmes depuis Supabase...');
      console.log('Programme courant:', currentProgram);

      const { data, error } = await supabase
        .from('programmes')
        .select('*');

      if (error) throw error;
      
      console.log('Programmes récupérés:', data);
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Une erreur est survenue lors du chargement des programmes');
    } finally {
      setIsLoading(false);
    }
  };

  const discoveryPrograms = programs
    .filter(p => p.type === 'Découverte')
    .map(toCardModel);

  const premiumPrograms = programs
    .filter(p => p.type === 'Premium')
    .map(toCardModel);
    
  console.log('Programme courant dans le rendu:', currentProgram?.id);

  const handleProgramPress = async (programId: string) => {
    try {
      console.log('Programme sélectionné:', programId);
      
      // Notification à l'utilisateur
      Alert.alert('Programme sélectionné', 'Vous avez choisi un nouveau programme');
      
      // Mettre à jour le contexte
      await selectProgram(programId);
      
      // Naviguer vers le rituel
      router.replace('/(app)/(tabs)/ritual');
    } catch (error) {
      console.error('Erreur lors de la sélection du programme:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner ce programme');
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const selectedIndex = Math.floor(contentOffset / viewSize);
    setActiveIndex(selectedIndex);
  };

  // Fonction pour vérifier si un programme est sélectionné
  const isProgramSelected = (programId: string): boolean => {
    if (!currentProgram) return false;
    return String(currentProgram.id) === String(programId);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          Aucun programme disponible pour le moment
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Debug info */}
      <Text style={{color: 'white'}}>
        Programme courant: {currentProgram ? currentProgram.id : 'aucun'}
      </Text>
      
      <View style={styles.header}>
        <Text style={styles.title}>LES VOIES</Text>
        <Text style={styles.subtitle}>Choisissez votre parcours de transformation</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>DÉCOUVERTE</Text>
        <Text style={styles.sectionDescription}>
          Programmes courts pour explorer les fondamentaux du mouvement ancestral.
        </Text>

        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          pagingEnabled
        >
          {discoveryPrograms.map(program => {
            const isSelected = isProgramSelected(program.id);
            console.log(`Programme ${program.title} (${program.id}) sélectionné: ${isSelected}`);
            
            return (
              <View key={program.id} style={styles.cardContainer}>
                <ProgramCard
                  program={program}
                  onPress={handleProgramPress}
                  isSelected={isSelected}
                />
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.paginationContainer}>
          {discoveryPrograms.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>LA VOIE MOHERO</Text>
        <Text style={styles.sectionDescription}>
          Programme complet de transformation physique et mentale.
        </Text>

        {premiumPrograms.map(program => {
          const isSelected = isProgramSelected(program.id);
          console.log(`Programme ${program.title} (${program.id}) sélectionné: ${isSelected}`);
          
          return (
            <ProgramCard
              key={program.id}
              program={program}
              onPress={handleProgramPress}
              isSelected={isSelected}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

// 🔁 Conversion Supabase → ProgramCardModel
function toCardModel(program: Program): ProgramCardModel {
  console.log('Conversion programme:', typeof program.id, JSON.stringify(program.id), program.nom);
  
  // S'assurer que l'ID est une chaîne de caractères
  const programId = String(program.id);
  
  return {
    id: programId,
    title: program.nom,
    description: program.description,
    imageUrl: program.image_url,
    duration: program.duree_jours,
    focus: program.tags || [],
    category: program.type === 'Découverte' ? 'discovery' : 'premium',
    details: {
      benefits: [],
      phases: []
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    letterSpacing: 2,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  sectionDescription: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.error,
    textAlign: 'center',
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  carouselContainer: {
    paddingRight: SPACING.lg,
  },
  cardContainer: {
    width: Dimensions.get('window').width - SPACING.lg * 2,
    marginRight: SPACING.md,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

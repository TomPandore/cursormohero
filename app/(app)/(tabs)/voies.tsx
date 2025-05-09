import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING } from '@/constants/Layout';
import ProgramCard from '@/components/ProgramCard';
import { supabase } from '@/lib/supabase';

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
}

export default function PathsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .db.from('programmes')
        .select('*');

      if (error) throw error;

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

  const handleProgramPress = (programId: string) => {
    router.push({
      pathname: '/(app)/program/[id]',
      params: { id: programId }
    });
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
      <View style={styles.header}>
        <Text style={styles.title}>LES VOIES</Text>
        <Text style={styles.subtitle}>Choisissez votre parcours de transformation</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>DÉCOUVERTE</Text>
        <Text style={styles.sectionDescription}>
          Programmes courts pour explorer les fondamentaux du mouvement ancestral.
        </Text>

        {discoveryPrograms.map(program => (
          <ProgramCard
            key={program.id}
            program={program}
            onPress={handleProgramPress}
          />
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>LA VOIE MOHERO</Text>
        <Text style={styles.sectionDescription}>
          Programme complet de transformation physique et mentale.
        </Text>

        {premiumPrograms.map(program => (
          <ProgramCard
            key={program.id}
            program={program}
            onPress={handleProgramPress}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// 🔁 Conversion Supabase → ProgramCardModel
function toCardModel(program: Program): ProgramCardModel {
  return {
    id: program.id,
    title: program.nom,
    description: program.description,
    imageUrl: program.image_url,
    duration: program.duree_jours,
    focus: program.tags || [],
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
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
});

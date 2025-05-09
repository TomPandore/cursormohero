import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import ClanCard from '@/components/ClanCard';
import PaginationDot from '@/components/PaginationDot';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Animated, { 
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - SPACING.lg * 2;

interface Clan {
  id: string;
  nom_clan: string;
  tagline: string;
  description: string;
  image_url: string;
}

export default function ClanSelectionScreen() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [selectedClanId, setSelectedClanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollX = useSharedValue(0);
  const { user, updateUserClan } = useAuth();
  
  useEffect(() => {
    fetchClans();
  }, []);

  const fetchClans = async () => {
    try {
      const { data, error } = await supabase
        .from('clans')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setClans(data);
    } catch (error) {
      console.error('Error fetching clans:', error);
    }
  };

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleSelectClan = (clanId: string) => {
    setSelectedClanId(clanId);
  };

  const handleNext = async () => {
    if (!selectedClanId) return;
    
    try {
      setIsLoading(true);
      
      // Update the user's profile with the selected clan
      const { error } = await supabase
        .from('profiles')
        .update({ clan_id: selectedClanId })
        .eq('id', user?.id);

      if (error) throw error;

      // Update local state through context
      await updateUserClan(selectedClanId);
    } catch (error) {
      console.error('Error updating clan:', error);
    }
  };

  const renderPaginationDots = () => {
    return clans.map((_, i) => (
      <PaginationDot
        key={`dot-${i}`}
        index={i}
        scrollX={scrollX}
        cardWidth={CARD_WIDTH + SPACING.md}
        isSelected={selectedClanId === clans[i].id}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MOHERO</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>DERNIÈRE ÉTAPE</Text>
          <Text style={styles.questionText}>
            Choisissez votre clan
          </Text>
        </View>

        <Animated.FlatList
          data={clans}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING.md}
          decelerationRate="fast"
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.carouselContainer}
          onScroll={handleScroll}
          renderItem={({ item, index }) => (
            <View style={{ width: CARD_WIDTH, marginRight: SPACING.md }}>
              <ClanCard
                clan={item}
                isSelected={selectedClanId === item.id}
                onSelect={() => handleSelectClan(item.id)}
                position={index}
                scrollPosition={scrollX}
                cardWidth={CARD_WIDTH + SPACING.md}
              />
            </View>
          )}
        />

        <View style={styles.paginationContainer}>
          {renderPaginationDots()}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Continuer"
            onPress={handleNext}
            disabled={!selectedClanId}
            isLoading={isLoading}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  title: {
    ...FONTS.heading,
    fontSize: 28,
    fontFamily: 'Rajdhani-Bold',
    color: COLORS.text,
    letterSpacing: 5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  stepContainer: {
    marginBottom: SPACING.lg,
  },
  stepText: {
    ...FONTS.caption,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  questionText: {
    ...FONTS.heading,
    color: COLORS.text,
  },
  carouselContainer: {
    paddingVertical: SPACING.lg,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonContainer: {
    marginVertical: SPACING.lg,
  },
});
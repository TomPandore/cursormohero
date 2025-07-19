import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Alert,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import ClanCard from '@/components/ClanCard';
import PaginationDot from '@/components/PaginationDot';
import { useAuth } from '@/context/AuthContext';
import { useProgram } from '@/context/ProgramContext';
import { supabase } from '@/lib/supabase';
import Animated, { 
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - SPACING.lg * 2;

interface Clan {
  id: string;
  nom_clan: string;
  tagline: string;
  tags?: string[];
  description: string;
  image_url: string;
}

export default function ClanSelectionScreen() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [selectedClanId, setSelectedClanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollX = useSharedValue(0);
  const { user, updateUserClan } = useAuth();
  const flatListRef = useRef<Animated.FlatList<Clan>>(null);
  const initialScrollDone = useRef(false);
  const router = useRouter();
  
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
      if (data) {
        // Formater les données pour s'assurer que les propriétés sont correctement formatées
        const formattedClans = data.map(clan => ({
          ...clan,
          // Tagline simple (fallback si vide)
          tagline: clan.tagline || '',
          // S'assurer que tags est un tableau
          tags: clan.tags || []
        }));
        
        // Si l'utilisateur a déjà un clan, le réorganiser pour l'afficher en premier
        if (user?.clanId) {
          let reorderedClans = [...formattedClans];
          const currentClanIndex = reorderedClans.findIndex(clan => clan.id === user.clanId);
          
          // Si le clan actuel existe dans la liste
          if (currentClanIndex !== -1) {
            const currentClan = reorderedClans.splice(currentClanIndex, 1)[0];
            reorderedClans = [currentClan, ...reorderedClans];
            setSelectedClanId(user.clanId);
          }
          
          setClans(reorderedClans);
        } else {
          setClans(formattedClans);
        }
      }
    } catch (error) {
      console.error('Error fetching clans:', error);
    }
  };

  // Effet pour faire défiler automatiquement jusqu'au clan actuel une fois que les clans sont chargés
  useEffect(() => {
    if (clans.length > 0 && user?.clanId && !initialScrollDone.current) {
      const currentClanIndex = clans.findIndex(clan => clan.id === user.clanId);
      if (currentClanIndex === 0 && flatListRef.current) {
        // Le clan actuel est déjà le premier, assurez-vous que la liste est scrollée au début
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        initialScrollDone.current = true;
      }
    }
  }, [clans, user?.clanId]);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleSelectClan = (clanId: string) => {
    setSelectedClanId(clanId);
  };

  // Fonction pour vérifier si un programme est spécifique à un clan
  const isProgramClanSpecific = (programId: string, clanId: string) => {
    const CLAN_PROGRAM_IDS: Record<string, string> = {
      'EKLOA': 'b378d5ab-0e4d-4436-98d3-408e7d268eb6',
      'ONOTKA': 'a0f7a883-f806-423b-827d-97bc004c7c17',
      'OKWÁHO': '692d1aae-f2b0-45b8-88d1-f9ef351b0b75',
    };
    
    // Trouve le clan qui correspond à ce programme
    const clanWithThisProgram = Object.keys(CLAN_PROGRAM_IDS).find(
      clanKey => CLAN_PROGRAM_IDS[clanKey] === programId
    );
    
    return clanWithThisProgram !== undefined;
  };

  const handleNext = async () => {
    if (!selectedClanId || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      // 1. Récupérer les données actuelles du profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('clans_seen, clan_id, programme_id')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      const currentClansSeenIds = profile?.clans_seen || [];
      const currentClanId = profile?.clan_id;
      const currentProgramId = profile?.programme_id;
      
      // 2. Vérifier si le clan sélectionné a déjà été vu
      const clanAlreadySeen = currentClansSeenIds.includes(selectedClanId);
      
      // 3. Vérifier si on change de clan
      const isChangingClan = currentClanId && currentClanId !== selectedClanId;
      
      // 4. Si on change de clan ET qu'on a un programme spécifique au clan actuel
      if (isChangingClan && currentProgramId && isProgramClanSpecific(currentProgramId, currentClanId)) {
        // Récupérer le nom du clan actuel
        const currentClan = clans.find(clan => clan.id === currentClanId);
          
        const currentClanName = currentClan?.nom_clan || 'votre clan actuel';
        
        // Récupérer le nom du nouveau clan
        const newClan = clans.find(clan => clan.id === selectedClanId);
          
        const newClanName = newClan?.nom_clan || 'ce clan';
        
        // Afficher dialogue de confirmation
        return new Promise((resolve) => {
          Alert.alert(
            'Changement de clan',
            `En rejoignant le clan ${newClanName}, tu perdras la progression de ton programme actuel spécifique au clan ${currentClanName}. Veux-tu continuer ?`,
            [
              {
                text: 'Annuler',
                style: 'cancel',
                onPress: () => {
                  setIsLoading(false);
                  resolve(false);
                }
              },
              {
                text: 'Continuer',
                style: 'destructive',
                onPress: async () => {
                  await processClanChange(selectedClanId, clanAlreadySeen, true);
                  resolve(true);
                }
              }
            ]
          );
        });
      } else {
        // Pas de conflit, continuer normalement
        await processClanChange(selectedClanId, clanAlreadySeen, false);
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      setIsLoading(false);
    }
  };

  const processClanChange = async (newClanId: string, clanAlreadySeen: boolean, removeProgram: boolean) => {
    try {
      if (!user?.id) throw new Error('User ID is required');
      
      // 1. Préparer les données à mettre à jour
      const updateData: any = {
        clan_id: newClanId,
        onboarding_done: true
      };
      
      // 2. Si on doit retirer le programme, le mettre à null
      if (removeProgram) {
        updateData.programme_id = null;
        updateData.progress = null;
      }
      
      // 3. Ajouter le clan aux clans vus s'il n'a pas encore été vu
      if (!clanAlreadySeen) {
        // Récupérer les clans actuels et ajouter le nouveau
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('clans_seen')
          .eq('id', user.id)
          .single();
          
        const currentClansSeenIds = currentProfile?.clans_seen || [];
        const updatedClansSeenIds = [...currentClansSeenIds, newClanId];
        
        // Mettre à jour avec le nouveau tableau
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            ...updateData,
            clans_seen: updatedClansSeenIds
          })
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      } else {
        // Le clan a déjà été vu, juste mettre à jour les autres champs
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      }

      // 4. Mettre à jour le contexte local
      await updateUserClan(newClanId);
      
      // 5. Navigation conditionnelle
      if (clanAlreadySeen) {
        // Clan déjà vu, aller directement au totem
        router.replace('/(app)/(tabs)/totem');
      } else {
        // Nouveau clan, afficher l'onboarding
        router.replace('/(auth)/onboarding/welcome-clan');
      }
      
    } catch (error) {
      console.error('Error updating clan:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du changement de clan.');
    } finally {
      setIsLoading(false);
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
      <View style={styles.contentContainer}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>DERNIÈRE ÉTAPE</Text>
          <Text style={styles.questionText}>
            Quel clan veux tu rejoindre ?
          </Text>
        </View>

        <Animated.FlatList
          ref={flatListRef}
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
    paddingTop: SPACING.xl * 2,
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
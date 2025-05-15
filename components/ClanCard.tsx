import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Shield } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';

interface ClanCardProps {
  clan: {
    id: string;
    nom_clan: string;
    tagline: string;
    tags?: string[];
    description: string;
    image_url: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  position: number;
  scrollPosition: Animated.SharedValue<number>;
  cardWidth: number;
}

export default function ClanCard({
  clan,
  isSelected,
  onSelect,
  position,
  scrollPosition,
  cardWidth,
}: ClanCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollPosition.value,
      [(position - 1) * cardWidth, position * cardWidth, (position + 1) * cardWidth],
      [0.9, 1, 0.9],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollPosition.value,
      [(position - 1) * cardWidth, position * cardWidth, (position + 1) * cardWidth],
      [0.7, 1, 0.7],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Utiliser les tags s'ils existent, sinon utiliser la tagline convertie
  let clanAttributes: string[] = [];
  
  if (clan.tags && Array.isArray(clan.tags) && clan.tags.length > 0) {
    // Si les tags existent et sont un tableau non vide, les utiliser directement
    clanAttributes = clan.tags;
  } else {
    // Sinon, fallback sur la conversion de tagline
    const getClanAttributes = (tagline: string): string[] => {
      try {
        // Essayer de parser comme JSON (format ["Force","Mobilité"])
        const parsedAttributes = JSON.parse(tagline);
        if (Array.isArray(parsedAttributes)) {
          return parsedAttributes;
        }
      } catch (e) {
        // Si ce n'est pas un JSON valide, traiter comme une chaîne séparée par des virgules
        if (typeof tagline === 'string') {
          return tagline.split(',').map(attr => attr.trim()).filter(attr => attr);
        }
      }
      
      // Fallback: retourner un tableau vide
      return [];
    };

    clanAttributes = getClanAttributes(clan.tagline);
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSelect}
        style={[
          styles.touchable,
          isSelected && { borderColor: COLORS.primary, borderWidth: 3 }
        ]}
      >
        <ImageBackground
          source={{ uri: clan.image_url }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: COLORS.primary }]}>
                <Shield size={24} color={COLORS.text} />
              </View>
            )}

            <View style={styles.contentContainer}>
              <View style={[styles.clanBadge, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.clanName}>{clan.nom_clan}</Text>
              </View>

              <View style={styles.attributesRow}>
                {clanAttributes.map((attribute, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{attribute}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.description}>{clan.description}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // ← remplace height fixe
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
  },
  imageBackground: {
    flex: 1,
  },
  imageStyle: {
    borderRadius: BORDER_RADIUS.lg,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'flex-start',
  },
  clanBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  clanName: {
    ...FONTS.heading,
    color: COLORS.text,
    fontFamily: 'Rajdhani-Bold',
  },
  attributesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  badgeText: {
    ...FONTS.caption,
    color: COLORS.text,
  },
  tagline: {
    ...FONTS.subheading,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    ...FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
});

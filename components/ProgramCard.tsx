import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ImageBackground 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import { Program } from '@/types';
import { Check, ArrowRight } from 'lucide-react-native';

interface ProgramCardProps {
  program: Program;
  onPress: (programId: string) => void;
  isSelected?: boolean;
}

export default function ProgramCard({ program, onPress, isSelected = false }: ProgramCardProps) {
  const getLevelColor = (level: string) => {
    switch(level) {
      case 'Facile':
        return 'rgba(108, 68, 217, 0.4)'; // Violet clair
      case 'Moyen':
        return 'rgba(108, 68, 217, 0.5)'; // Violet moyen
      case 'Extrême':
        return 'rgba(108, 68, 217, 0.6)'; // Violet intense
      case 'Progressif':
        return 'rgba(76, 195, 255, 0.5)'; // Bleu du branding pour distinguer le type évolutif
      default:
        return 'rgba(108, 68, 217, 0.5)';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
      activeOpacity={0.9}
      onPress={() => onPress(program.id)}
    >
      {isSelected && (
        <View style={styles.selectedBadge}>
          <Check size={16} color={COLORS.text} />
        </View>
      )}
      <ImageBackground
        source={{ uri: program.imageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(program.level) }]}>
              <Text style={styles.levelText}>{program.level}</Text>
            </View>
            
            <View style={styles.mainContent}>
              <Text style={styles.title}>{program.title}</Text>
            <View style={styles.detailsRow}>
              {program.focus.map((focus, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeText}>{focus}</Text>
                </View>
              ))}
            </View>
              </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBackground: {
    flex: 1,
  },
  imageStyle: {
    borderRadius: BORDER_RADIUS.lg,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  levelText: {
    ...FONTS.caption,
    color: COLORS.text,
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 22,
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    ...FONTS.caption,
    color: COLORS.text,
    fontSize: 12,
  },
});
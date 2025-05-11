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
import { Check } from 'lucide-react-native';

interface ProgramCardProps {
  program: Program;
  onPress: (programId: string) => void;
  isSelected?: boolean;
}

export default function ProgramCard({ program, onPress, isSelected = false }: ProgramCardProps) {
  // Debug log pour vérifier si le programme est sélectionné
  console.log(`Rendu ProgramCard ${program.title} - sélectionné: ${isSelected}`);
  
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
          colors={isSelected 
            ? ['rgba(76, 195, 255, 0.3)', 'rgba(108, 68, 217, 0.7)'] 
            : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{program.title}</Text>
            
            <View style={styles.detailsRow}>
              {program.focus.map((focus, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeText}>{focus}</Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.description}>{program.description}</Text>
            
            {isSelected && (
              <View style={styles.selectedTextContainer}>
                <Text style={styles.selectedText}>Programme en cours</Text>
              </View>
            )}
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
    borderWidth: 3,  // Augmenté pour rendre plus visible
    borderColor: COLORS.primary,
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    width: 28,  // Légèrement agrandi
    height: 28,  // Légèrement agrandi
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
    justifyContent: 'flex-end',
  },
  contentContainer: {
    padding: SPACING.md,
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
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
  description: {
    ...FONTS.body,
    color: COLORS.text,
  },
  selectedTextContainer: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(140, 111, 247, 0.3)',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  selectedText: {
    ...FONTS.caption,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});
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

interface ProgramCardProps {
  program: Program;
  onPress: (programId: string) => void;
}

export default function ProgramCard({ program, onPress }: ProgramCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => onPress(program.id)}
    >
      <ImageBackground
        source={{ uri: program.imageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{program.title}</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{program.duration} jours</Text>
              </View>
              
              {program.focus.map((focus, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeText}>{focus}</Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.description}>{program.description}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
});
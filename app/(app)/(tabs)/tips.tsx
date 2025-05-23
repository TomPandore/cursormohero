import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING } from '@/constants/Layout';

export default function TipsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Conseils</Text>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            Cette section est en cours de développement.
          </Text>
          <Text style={styles.submessage}>
            Revenez bientôt pour découvrir des conseils personnalisés pour votre parcours.
          </Text>
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
  contentContainer: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
    marginBottom: SPACING.lg,
    letterSpacing: 2,
  },
  messageContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  message: {
    ...FONTS.subheading,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  submessage: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
}); 
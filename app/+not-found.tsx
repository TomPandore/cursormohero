import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>MOHERO</Text>
        <Text style={styles.text}>Cette page n'existe pas.</Text>
        <Link href="/" asChild>
          <Button title="Retourner à l'accueil" style={styles.button} />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.heading,
    fontSize: 32,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  text: {
    ...FONTS.body,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  button: {
    minWidth: 200,
  },
});
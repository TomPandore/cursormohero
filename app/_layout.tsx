import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { 
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_700Bold 
} from '@expo-google-fonts/rajdhani';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { ProgramProvider } from '@/context/ProgramContext';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Rajdhani-Regular': Rajdhani_400Regular,
    'Rajdhani-Medium': Rajdhani_500Medium,
    'Rajdhani-Bold': Rajdhani_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AuthProvider>
        <ProgramProvider>
          <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background }
          }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </ProgramProvider>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  }
});
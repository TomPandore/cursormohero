import { Tabs } from 'expo-router';
import { COLORS, SHADOWS } from '@/constants/Colors';
import { FONTS } from '@/constants/Layout';
import { Mountain, Compass, Flame, User, Lightbulb } from 'lucide-react-native';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 60 + insets.bottom, // Ajouter la safe area bottom
          paddingBottom: Math.max(insets.bottom, 5), // Au minimum 5px, ou la safe area
          paddingTop: 5,
          ...SHADOWS.medium,
        },
        tabBarLabelStyle: {
          ...FONTS.caption,
          fontFamily: 'Rajdhani-Medium',
          fontSize: 10,
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="totem"
        options={{
          title: 'Totem',
          tabBarIcon: ({ color, size }) => <Mountain size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="voies"
        options={{
          title: 'Voies',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ritual"
        options={{
          title: 'Rituels du jour',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.centerTabContainer}>
              {/* Bouton circulaire surélevé */}
              <View style={[
                styles.centerBtnContainer,
                {
                  backgroundColor: focused ? COLORS.primary : COLORS.card,
                  borderColor: focused ? COLORS.primary : 'rgba(140, 111, 247, 0.3)',
                }
              ]}>
                <Flame size={size + 2} color={focused ? "#FFFFFF" : color} />
              </View>
              {/* Plus d'indicateur pour le bouton central */}
            </View>
          ),
          // Style par défaut pour le label
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          title: 'Conseils',
          tabBarIcon: ({ color, size }) => <Lightbulb size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  centerBtnContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginTop: -35,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  // J'ai supprimé le style activeIndicator qui n'est plus utilisé
});
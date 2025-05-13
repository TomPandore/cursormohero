import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { FONTS } from '@/constants/Layout';
import { Mountain, Compass, Flame, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          ...FONTS.caption,
          fontFamily: 'Rajdhani-Medium',
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
          tabBarIcon: ({ color, size }) => <Flame size={size} color={color} />,
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
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { Settings, User, LogOut, Award, CreditCard as Edit } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const [clanName, setClanName] = useState('');
  
  useEffect(() => {
    if (user?.clanId) {
      fetchClanName();
    }
  }, [user?.clanId]);

  const fetchClanName = async () => {
    try {
      const { data, error } = await supabase
        .from('clans')
        .select('nom_clan')
        .eq('id', user?.clanId)
        .single();

      if (error) throw error;
      if (data) setClanName(data.nom_clan);
    } catch (error) {
      console.error('Error fetching clan name:', error);
    }
  };
  
  if (!user) return null;
  
  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        signOut();
      }
      return;
    }
    
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', onPress: () => signOut() },
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/7674497/pexels-photo-7674497.jpeg' }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editButton}>
              <Edit size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userClan}>Clan {clanName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalDaysCompleted}</Text>
            <Text style={styles.statLabel}>Jours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Programmes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <User size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuItemText}>Profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuItemText}>Paramètres de l'application</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Award size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuItemText}>Mes accomplissements</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>APPLICATION</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>À propos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Conditions d'utilisation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Politique de confidentialité</Text>
        </TouchableOpacity>
      </View>
      
      <Button
        title="Déconnexion"
        onPress={handleSignOut}
        variant="outline"
        iconLeft={<LogOut size={20} color={COLORS.primary} />}
        style={styles.logoutButton}
      />
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  header: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: SPACING.lg,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: SPACING.md,
  },
  userName: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 20,
  },
  userClan: {
    ...FONTS.body,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 24,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  menuSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  menuItemText: {
    ...FONTS.body,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  logoutButton: {
    marginVertical: SPACING.lg,
  },
  versionText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
});
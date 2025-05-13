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
  Modal,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { Settings, User, LogOut, Award, CreditCard as Edit, X, Trash, AlertTriangle, ShoppingCart, Gift } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const [clanName, setClanName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [localUserData, setLocalUserData] = useState(user);
  const [clanId, setClanId] = useState('');
  
  useEffect(() => {
    if (user?.clanId) {
      console.log('User clanId detected:', user.clanId);
      fetchClanName();
      // We'll set clanId in fetchClanName to ensure we get the right format
    }
    
    // Initialize edit fields and local user data with current values
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setLocalUserData(user);
    }
  }, [user?.clanId, user]);

  const fetchClanName = async () => {
    try {
      if (!user?.clanId) {
        console.log('No clan ID available');
        return;
      }
      
      console.log('Fetching clan details for ID:', user.clanId);
      const { data, error } = await supabase
        .from('clans')
        .select('id, nom_clan')
        .eq('id', user.clanId)
        .single();

      if (error) {
        console.error('Error fetching clan:', error);
        throw error;
      }
      
      if (data) {
        console.log('Clan data retrieved:', data);
        setClanName(data.nom_clan);
        // Set clan ID with the value from the database to ensure it's the correct type/format
        setClanId(data.id);
      }
    } catch (error) {
      console.error('Error fetching clan name:', error);
    }
  };
  
  // Function to get the avatar URL based on clan name
  const getAvatarUrl = () => {
    console.log('Getting avatar for clan name:', clanName);
    
    // Return default avatar if no clan name is available
    if (!clanName) {
      console.log('No clan name available, using default avatar');
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-base.png';
    }
    
    if (clanName.toUpperCase().includes('ONOTKA')) {
      console.log('Using Onotka avatar');
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-onotka.png';
    } else if (clanName.toUpperCase().includes('EKLOA')) {
      console.log('Using Ekloa avatar');
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-ekloa.png';
    } else if (clanName.toUpperCase().includes('OKWÁHO') || clanName.toUpperCase().includes('OKWAHO')) {
      console.log('Using Okwaho avatar');
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-okwadho.png';
    } else {
      console.log('Using default avatar, clan name not matched:', clanName);
      return 'https://mohero.fr/wp-content/uploads/2025/05/avatar-base.png';
    }
  };
  
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    if (!editName.trim()) {
      setUpdateError('Le nom ne peut pas être vide');
      return;
    }
    
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setUpdateError('Adresse email invalide');
      return;
    }
    
    try {
      setIsUpdating(true);
      setUpdateError('');
      
      // Update the profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          email: editEmail
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update auth for email change if needed, but don't wait for it
      // This will take effect on next login but won't disrupt current session
      if (user.email !== editEmail) {
        supabase.auth.updateUser({
          email: editEmail,
        }).then(({ error }) => {
          if (error) {
            console.error('Email update in auth will apply on next login:', error);
          }
        });
      }
      
      // Update local state instead of reloading
      setLocalUserData(prev => {
        if (prev) {
          return {
            ...prev,
            name: editName,
            email: editEmail
          };
        }
        return prev;
      });
      
      // Show success message
      Alert.alert('Profil mis à jour', 'Vos informations ont été mises à jour avec succès.');
      
      // Close modal
      setModalVisible(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError('Erreur lors de la mise à jour du profil');
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (!localUserData) return null;
  
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
              source={{ uri: getAvatarUrl() }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editButton}>
              <Edit size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{localUserData.name}</Text>
            <Text style={styles.userClan}>Clan {clanName}</Text>
            <Text style={styles.userEmail}>{localUserData.email}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => setModalVisible(true)}>
          <User size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuItemText}>Modifier le profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteAccountItem}>
          <Trash size={20} color={COLORS.error} />
          <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>SOUTENIR MOHERO</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Gift size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuItemText}>Campagne Ulule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <ShoppingCart size={20} color={COLORS.textSecondary} />
          <Text style={styles.menuItemText}>Boutique</Text>
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
          <Text style={styles.menuItemText}>Confidentialité & Mentions légales</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Remerciements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Aides & Assistance</Text>
        </TouchableOpacity>
      </View>
      
      <Button
        title="Déconnexion"
        onPress={handleSignOut}
        variant="outline"
        iconLeft={<LogOut size={20} color={COLORS.primary} />}
        style={styles.logoutButton}
      />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {updateError ? (
              <Text style={styles.errorText}>{updateError}</Text>
            ) : null}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Votre nom"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Votre email"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.modalActions}>
              <Button 
                title="Annuler" 
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              
              <Button 
                title="Enregistrer" 
                onPress={handleUpdateProfile}
                isLoading={isUpdating}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  deleteAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 101, 101, 0.2)',
  },
  deleteAccountText: {
    ...FONTS.body,
    color: COLORS.error,
    marginLeft: SPACING.md,
  },
  logoutButton: {
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: 100,
    height: 40,
  },
  versionText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...FONTS.heading,
    color: COLORS.text,
    fontSize: 20,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
});
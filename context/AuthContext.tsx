import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserClan: (clanId: string) => Promise<void>;
}

const defaultContext: AuthContextProps = {
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateUserClan: async () => {},
};

const AuthContext = createContext<AuthContextProps>(defaultContext);

// For storage in dev environment
const STORAGE_KEY = 'user-auth';

async function saveToStorage(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getFromStorage(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function removeFromStorage(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await supabase.auth.getSession();
        
        // If no session exists, set loading to false and return early
        if (!session.data.session) {
          setIsLoading(false);
          return;
        }

        // Fetch the user profile using maybeSingle() to handle cases where profile doesn't exist
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.data.session.user.id)
          .maybeSingle();

        // If no profile exists, create it
        if (!profile) {
          console.log('Création du profil manquant...');
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: session.data.session.user.id,
              name: session.data.session.user.user_metadata?.name || 'Utilisateur',
              email: session.data.session.user.email || '',
              progress: { totalCompletedDays: 0 },
              onboarding_done: false
            });
          
          if (profileError) {
            console.error('Erreur lors de la création du profil:', profileError);
            throw profileError;
          }
          
          // Recharger le profil
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.data.session.user.id)
            .single();
            
          profile = newProfile;
        }

        // If still no profile exists, set loading to false and return early
        if (!profile) {
          setIsLoading(false);
          return;
        }

        const progress = profile.progress as { totalCompletedDays: number };
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          clanId: profile.clan_id,
          totalDaysCompleted: progress?.totalCompletedDays || 0,
          onboardingDone: profile.onboarding_done || false,
          initiationCompleted: profile.initiation_completed || false
        };
        setUser(userData);
        
        // Vérifier si l'utilisateur a terminé l'onboarding
        if (!profile.onboarding_done) {
          router.replace('/(auth)/onboarding');
          return;
        }
        
        // Si l'onboarding est fait mais pas l'initiation, rediriger vers l'initiation
        if (!profile.initiation_completed) {
          router.replace('/(auth)/onboarding/initiation');
          return;
        }
        
        // Si l'initiation est faite mais pas de clan, rediriger vers la sélection de clan
        if (!profile.clan_id) {
          router.replace('/(auth)/onboarding/clan');
        } else {
          router.replace('/(app)/(tabs)/totem');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile) {
          const progress = profile.progress as { totalCompletedDays: number };
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            clanId: profile.clan_id,
            totalDaysCompleted: progress?.totalCompletedDays || 0,
            onboardingDone: profile.onboarding_done || false,
            initiationCompleted: profile.initiation_completed || false
          };
          setUser(userData);
          
          // Vérifier si l'utilisateur a terminé l'onboarding
          if (!profile.onboarding_done) {
            router.replace('/(auth)/onboarding');
            return;
          }
          
          // Si l'onboarding est fait mais pas l'initiation, rediriger vers l'initiation
          if (!profile.initiation_completed) {
            router.replace('/(auth)/onboarding/initiation');
            return;
          }
          
          // Si l'initiation est faite mais pas de clan, rediriger vers la sélection de clan
          if (!profile.clan_id) {
            router.replace('/(auth)/onboarding/clan');
          } else {
            router.replace('/(app)/(tabs)/totem');
          }
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        try {
          // Vérifier d'abord si un profil existe déjà pour cet utilisateur
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          // Si le profil existe déjà, on l'utilise directement
          if (existingProfile) {
            console.log('Profil existant trouvé, utilisation de celui-ci');
            
            const progress = existingProfile.progress as { totalCompletedDays: number };
            const userData: User = {
              id: existingProfile.id,
              name: existingProfile.name,
              email: existingProfile.email,
              clanId: existingProfile.clan_id,
              totalDaysCompleted: progress?.totalCompletedDays || 0,
              onboardingDone: existingProfile.onboarding_done || false,
              initiationCompleted: existingProfile.initiation_completed || false
            };
            
            setUser(userData);
            
            // Toujours rediriger vers l'onboarding, peu importe l'état précédent
            router.replace('/(auth)/onboarding');
            return;
          }
          
          // Si aucun profil n'existe, en créer un nouveau
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              name: name,
              email: email,
              progress: { totalCompletedDays: 0 },
              onboarding_done: false
            });
          
          if (profileError) {
            console.error('Erreur lors de la création du profil:', profileError);
            throw profileError;
          }

        const userData: User = {
          id: authData.user.id,
          name: name,
          email: email,
          clanId: null,
          totalDaysCompleted: 0,
            onboardingDone: false,
            initiationCompleted: false
          };
          
          setUser(userData);
          router.replace('/(auth)/onboarding');
        } catch (profileError) {
          // Si l'erreur est une violation de contrainte d'unicité, essayer de récupérer l'utilisateur existant
          if ((profileError as any)?.code === '23505') {
            console.log('Tentative de récupération du profil existant après erreur de duplication');
            
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', email)
              .maybeSingle();
              
            if (existingUser) {
              const progress = existingUser.progress as { totalCompletedDays: number };
              const userData: User = {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                clanId: existingUser.clan_id,
                totalDaysCompleted: progress?.totalCompletedDays || 0,
                onboardingDone: existingUser.onboarding_done || false,
                initiationCompleted: existingUser.initiation_completed || false
        };
        
        setUser(userData);
              
              // Toujours rediriger vers l'onboarding, peu importe l'état précédent
              router.replace('/(auth)/onboarding');
              return;
            }
          }
          
          // Si l'erreur n'est pas de duplication ou si la récupération a échoué, relancer l'erreur
          throw profileError;
        }
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserClan = async (clanId: string) => {
    try {
      setIsLoading(true);
      
      if (!user) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ clan_id: clanId })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUser(prev => prev ? { ...prev, clanId } : null);
      router.replace('/(app)/(tabs)/totem');
    } catch (error) {
      console.error('Failed to update clan:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUserClan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
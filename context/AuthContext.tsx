import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
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

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateUserClan: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await supabase.auth.getSession();
        const currentUser = session.data.session?.user;

        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

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
        };
        setUser(userData);

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

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);

      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (authError) throw authError;

      // Rediriger vers une page de confirmation
      router.replace('/(auth)/email-confirm');
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const connectedUser = data.user;
      if (!connectedUser) throw new Error('User not returned');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', connectedUser.id)
        .maybeSingle();

      if (!profile) {
        // Créer un profil maintenant que la session est active (auth.uid() OK)
        const { error: insertError } = await supabase.from('profiles').insert({
          id: connectedUser.id,
          name: connectedUser.user_metadata.name,
          email: connectedUser.email,
          progress: { totalCompletedDays: 0 },
        });

        if (insertError) throw insertError;
      }

      // Recharger le profil après insert
      const { data: finalProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', connectedUser.id)
        .maybeSingle();

      if (!finalProfile) throw new Error('Profil manquant après création');

      const progress = finalProfile.progress as { totalCompletedDays: number };
      const userData: User = {
        id: finalProfile.id,
        name: finalProfile.name,
        email: finalProfile.email,
        clanId: finalProfile.clan_id,
        totalDaysCompleted: progress?.totalCompletedDays || 0,
      };

      setUser(userData);

      if (!finalProfile.clan_id) {
        router.replace('/(auth)/onboarding/clan');
      } else {
        router.replace('/(app)/(tabs)/totem');
      }
    } catch (error) {
      console.error('Sign in failed:', error);
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

      setUser((prev) => (prev ? { ...prev, clanId } : null));
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

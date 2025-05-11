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
        
        if (!session.data.session) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.data.session.user.id)
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
          };
          setUser(userData);
          
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
        // Create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: name,
            email: email,
            progress: { totalCompletedDays: 0 }
          });

        if (profileError) throw profileError;

        const userData: User = {
          id: authData.user.id,
          name: name,
          email: email,
          clanId: null,
          totalDaysCompleted: 0,
        };
        
        setUser(userData);
        router.push('/(auth)/onboarding/clan');
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
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface AudioContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  playSound: (soundFile: any, volume?: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabledState] = useState(true); // Par défaut activé
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  // Charger la préférence depuis la base de données
  useEffect(() => {
    if (user?.sound_enabled !== undefined) {
      setSoundEnabledState(user.sound_enabled);
    }
  }, [user?.sound_enabled]);

  // Nettoyer le son en cours lors du démontage
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  const setSoundEnabled = async (enabled: boolean) => {
    try {
      setSoundEnabledState(enabled);
      
      // Mettre à jour dans la base de données si l'utilisateur est connecté
      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ sound_enabled: enabled })
          .eq('id', user.id);

        if (error) {
          console.error('Erreur lors de la mise à jour de la préférence sonore:', error);
          // Revenir à l'état précédent en cas d'erreur
          setSoundEnabledState(!enabled);
          throw error;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la préférence sonore:', error);
      throw error;
    }
  };

  const playSound = async (soundFile: any, volume: number = 0.7) => {
    if (!soundEnabled) {
      console.log('Sons désactivés, pas de lecture');
      return;
    }

    try {
      // Arrêter le son précédent s'il existe
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }

      const { sound } = await Audio.Sound.createAsync(
        soundFile,
        { 
          shouldPlay: true, 
          volume: volume 
        }
      );
      
      setCurrentSound(sound);

      // Nettoyer automatiquement quand le son est terminé
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setCurrentSound(null);
        }
      });

    } catch (error) {
      console.error('Erreur lors de la lecture du son:', error);
    }
  };

  return (
    <AudioContext.Provider value={{
      soundEnabled,
      setSoundEnabled,
      playSound
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Program, DailyRitual, UserProgram } from '@/types';
import { mockPrograms, mockDailyRituals } from '@/data/mockData';

interface ProgramContextProps {
  programs: Program[];
  dailyRituals: DailyRitual[];
  currentProgram: Program | null;
  userPrograms: UserProgram[];
  isLoading: boolean;
  selectProgram: (programId: string) => Promise<void>;
  getCurrentDayRitual: () => DailyRitual | null;
  updateExerciseProgress: (exerciseId: string, reps: number) => void;
  completeDay: () => void;
}

const defaultContext: ProgramContextProps = {
  programs: [],
  dailyRituals: [],
  currentProgram: null,
  userPrograms: [],
  isLoading: true,
  selectProgram: async () => {},
  getCurrentDayRitual: () => null,
  updateExerciseProgress: () => {},
  completeDay: () => {},
};

const ProgramContext = createContext<ProgramContextProps>(defaultContext);

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [dailyRituals, setDailyRituals] = useState<DailyRitual[]>([]);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // In a real app, fetch from an API
        setPrograms(mockPrograms);
        setDailyRituals(mockDailyRituals);
        
        // Set a default current program for demo
        const defaultProgram = mockPrograms.find(p => p.id === 'crocodile-tide');
        setCurrentProgram(defaultProgram || null);
        
        // Set a mock user program for demonstration
        setUserPrograms([
          {
            programId: 'crocodile-tide',
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            currentDay: 3,
            completed: false,
          }
        ]);
      } catch (error) {
        console.error('Failed to load programs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const selectProgram = async (programId: string) => {
    try {
      setIsLoading(true);
      const program = programs.find(p => p.id === programId);
      if (!program) throw new Error('Program not found');
      
      setCurrentProgram(program);
      
      // Check if user already has this program
      const existingProgram = userPrograms.find(p => p.programId === programId);
      
      if (!existingProgram) {
        // Add new program
        const newUserProgram: UserProgram = {
          programId,
          startDate: new Date(),
          currentDay: 1,
          completed: false,
        };
        
        setUserPrograms([...userPrograms, newUserProgram]);
      }
    } catch (error) {
      console.error('Failed to select program:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDayRitual = (): DailyRitual | null => {
    if (!currentProgram) return null;
    
    const userProgram = userPrograms.find(up => up.programId === currentProgram.id);
    if (!userProgram) return null;
    
    const ritual = dailyRituals.find(
      dr => dr.programId === currentProgram.id && dr.day === userProgram.currentDay
    );
    
    return ritual || null;
  };

  const updateExerciseProgress = (exerciseId: string, reps: number) => {
    const ritual = getCurrentDayRitual();
    if (!ritual) return;
    
    const updatedRituals = dailyRituals.map(dr => {
      if (dr.id === ritual.id) {
        return {
          ...dr,
          exercises: dr.exercises.map(ex => 
            ex.id === exerciseId 
              ? { ...ex, completedReps: Math.min(ex.completedReps + reps, ex.targetReps) }
              : ex
          ),
        };
      }
      return dr;
    });
    
    setDailyRituals(updatedRituals);
  };

  const completeDay = () => {
    if (!currentProgram) return;
    
    const updatedUserPrograms = userPrograms.map(up => {
      if (up.programId === currentProgram.id) {
        const nextDay = up.currentDay + 1;
        const isCompleted = nextDay > currentProgram.duration;
        
        return {
          ...up,
          currentDay: nextDay,
          completed: isCompleted,
        };
      }
      return up;
    });
    
    setUserPrograms(updatedUserPrograms);
    
    // Mark the current ritual as completed
    const ritual = getCurrentDayRitual();
    if (ritual) {
      setDailyRituals(
        dailyRituals.map(dr => 
          dr.id === ritual.id 
            ? { ...dr, isCompleted: true }
            : dr
        )
      );
    }
  };

  return (
    <ProgramContext.Provider
      value={{
        programs,
        dailyRituals,
        currentProgram,
        userPrograms,
        isLoading,
        selectProgram,
        getCurrentDayRitual,
        updateExerciseProgress,
        completeDay,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}
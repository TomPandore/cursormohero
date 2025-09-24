export interface User {
  id: string;
  name: string;
  email: string;
  gender?: 'homme' | 'femme' | null;
  clanId: string | null;
  totalDaysCompleted: number;
  currentProgramId?: string;
  onboardingDone?: boolean;
  initiationCompleted?: boolean;
  sound_enabled?: boolean;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: 'discovery' | 'premium';
  focus: string[];
  imageUrl: string;
  imageVoieFemme?: string | null;
  level: 'Facile' | 'Moyen' | 'Extrême' | 'Progressif';
  clan_id?: string;
  details: {
    benefits: string[];
    phases: {
      title: string;
      description: string;
    }[];
  };
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  targetReps: number;
  completedReps: number;
  isDurationBased?: boolean; // true pour les exercices en durée (secondes), false/undefined pour les répétitions
}

export interface DailyRitual {
  id: string;
  programId: string;
  day: number;
  quote: string;
  exercises: Exercise[];
  isCompleted: boolean;
}

export interface UserProgram {
  programId: string;
  startDate: Date;
  currentDay: number;
  completed: boolean;
  lastUpdated: Date;
}

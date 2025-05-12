export interface User {
  id: string;
  name: string;
  email: string;
  clanId: string | null;
  totalDaysCompleted: number;
  currentProgramId?: string;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: 'discovery' | 'premium';
  focus: string[];
  imageUrl: string;
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
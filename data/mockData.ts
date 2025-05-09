import { Program, DailyRitual, Exercise } from '@/types';

// Mock Programs
export const mockPrograms: Program[] = [
  {
    id: 'crocodile-tide',
    title: 'Marée du Crocodile',
    description: 'Un programme d\'introduction pour développer force et mobilité à travers des mouvements fonctionnels.',
    duration: 7,
    category: 'discovery',
    focus: ['Mobilité', 'Force', 'Respiration'],
    imageUrl: 'https://images.pexels.com/photos/4162581/pexels-photo-4162581.jpeg',
    details: {
      benefits: [
        'Amélioration de la mobilité des hanches et des épaules',
        'Renforcement du core et du haut du corps',
        'Meilleure respiration et récupération',
        'Introduction aux mouvements fonctionnels'
      ],
      phases: [
        {
          title: 'Éveil (Jours 1-2)',
          description: 'Préparer le corps avec des mouvements simples et des techniques de respiration.'
        },
        {
          title: 'Force (Jours 3-5)',
          description: 'Développer la force fonctionnelle avec des mouvements composés.'
        },
        {
          title: 'Intégration (Jours 6-7)',
          description: 'Combiner mobilité et force dans des séquences de mouvements fluides.'
        }
      ]
    }
  },
  {
    id: 'jaguar-breath',
    title: 'Souffle du Jaguar',
    description: 'Un programme centré sur l\'explosivité et la coordination pour les athlètes en devenir.',
    duration: 6,
    category: 'discovery',
    focus: ['Explosivité', 'Coordination', 'Vitesse'],
    imageUrl: 'https://images.pexels.com/photos/6295721/pexels-photo-6295721.jpeg',
    details: {
      benefits: [
        'Amélioration de la puissance explosive',
        'Meilleure coordination inter-musculaire',
        'Augmentation de la vitesse de réaction',
        'Développement de l\'agilité'
      ],
      phases: [
        {
          title: 'Activation (Jours 1-2)',
          description: 'Réveiller les chaînes musculaires avec des exercices de coordination.'
        },
        {
          title: 'Puissance (Jours 3-4)',
          description: 'Développer l\'explosivité avec des mouvements dynamiques.'
        },
        {
          title: 'Vitesse (Jours 5-6)',
          description: 'Affiner la rapidité d\'exécution et la précision des mouvements.'
        }
      ]
    }
  },
  {
    id: 'mohero-origin',
    title: 'Mohero Origin',
    description: 'Le programme complet pour transformer votre corps et votre esprit à travers 42 jours d\'entraînement tribal.',
    duration: 42,
    category: 'premium',
    focus: ['Force', 'Mobilité', 'Endurance', 'Équilibre'],
    imageUrl: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg',
    details: {
      benefits: [
        'Transformation complète du physique',
        'Développement d\'une force fonctionnelle durable',
        'Amélioration drastique de la mobilité et de la posture',
        'Endurance physique et mentale accrue',
        'Connaissance approfondie des mouvements ancestraux'
      ],
      phases: [
        {
          title: 'Fondation (Jours 1-10)',
          description: 'Construire les bases du mouvement fonctionnel et de la respiration.'
        },
        {
          title: 'Élévation (Jours 11-25)',
          description: 'Intensifier le travail de force et développer l\'endurance musculaire.'
        },
        {
          title: 'Transformation (Jours 26-35)',
          description: 'Combiner les acquis en séquences complexes pour une intégration complète.'
        },
        {
          title: 'Transcendance (Jours 36-42)',
          description: 'Dépasser ses limites et affiner son corps comme un outil parfait.'
        }
      ]
    }
  }
];

// Mock Exercises
const mockExercises: Exercise[] = [
  {
    id: 'squats',
    name: 'Squats Profonds',
    description: 'Accroupissement complet avec alignement naturel',
    imageUrl: 'https://images.pexels.com/photos/4498482/pexels-photo-4498482.jpeg',
    videoUrl: 'https://example.com/videos/squats.mp4',
    targetReps: 100,
    completedReps: 0
  },
  {
    id: 'pushups',
    name: 'Pompes',
    description: 'Pompes avec engagement du core et alignement parfait',
    imageUrl: 'https://images.pexels.com/photos/176782/pexels-photo-176782.jpeg',
    videoUrl: 'https://example.com/videos/pushups.mp4',
    targetReps: 30,
    completedReps: 0
  },
  {
    id: 'plank',
    name: 'Planche Active',
    description: 'Maintien en position de planche avec engagement maximal',
    imageUrl: 'https://images.pexels.com/photos/866023/pexels-photo-866023.jpeg',
    videoUrl: 'https://example.com/videos/plank.mp4',
    targetReps: 120, // seconds
    completedReps: 0
  },
  {
    id: 'breath',
    name: 'Respiration Tribale',
    description: 'Technique de respiration profonde avec rétention',
    imageUrl: 'https://images.pexels.com/photos/3771115/pexels-photo-3771115.jpeg',
    videoUrl: 'https://example.com/videos/breathing.mp4',
    targetReps: 30,
    completedReps: 0
  },
  {
    id: 'burpees',
    name: 'Burpees',
    description: 'Mouvement explosif combinant squat, pompe et saut',
    imageUrl: 'https://images.pexels.com/photos/28080/pexels-photo.jpg',
    videoUrl: 'https://example.com/videos/burpees.mp4',
    targetReps: 50,
    completedReps: 0
  },
  {
    id: 'lunges',
    name: 'Fentes Dynamiques',
    description: 'Fentes avec rotation du tronc et mobilité des hanches',
    imageUrl: 'https://images.pexels.com/photos/6456143/pexels-photo-6456143.jpeg',
    videoUrl: 'https://example.com/videos/lunges.mp4',
    targetReps: 60,
    completedReps: 0
  }
];

// Mock Daily Rituals
export const mockDailyRituals: DailyRitual[] = [
  {
    id: 'crocodile-d1',
    programId: 'crocodile-tide',
    day: 1,
    quote: 'Le voyage commence par un simple pas. Aujourd\'hui, nous réveillons la bête qui sommeille.',
    exercises: [mockExercises[0], mockExercises[1], mockExercises[3]],
    isCompleted: false
  },
  {
    id: 'crocodile-d2',
    programId: 'crocodile-tide',
    day: 2,
    quote: 'La force vient de la répétition. Chaque mouvement te rapproche de ton but.',
    exercises: [mockExercises[0], mockExercises[2], mockExercises[3]],
    isCompleted: false
  },
  {
    id: 'crocodile-d3',
    programId: 'crocodile-tide',
    day: 3,
    quote: 'Comme l\'eau qui sculpte la pierre, ta persévérance façonne ton corps.',
    exercises: [mockExercises[0], mockExercises[1], mockExercises[4], mockExercises[3]],
    isCompleted: false
  },
  {
    id: 'crocodile-d4',
    programId: 'crocodile-tide',
    day: 4,
    quote: 'L\'équilibre entre effort et repos forge les guerriers les plus redoutables.',
    exercises: [mockExercises[5], mockExercises[2], mockExercises[3]],
    isCompleted: false
  },
  {
    id: 'crocodile-d5',
    programId: 'crocodile-tide',
    day: 5,
    quote: 'Ta sueur d\'aujourd\'hui est ton armure de demain.',
    exercises: [mockExercises[4], mockExercises[1], mockExercises[0], mockExercises[3]],
    isCompleted: false
  },
  {
    id: 'crocodile-d6',
    programId: 'crocodile-tide',
    day: 6,
    quote: 'Dans chaque mouvement réside la sagesse de tes ancêtres.',
    exercises: [mockExercises[0], mockExercises[1], mockExercises[5], mockExercises[3]],
    isCompleted: false
  },
  {
    id: 'crocodile-d7',
    programId: 'crocodile-tide',
    day: 7,
    quote: 'Le dernier jour n\'est que le début d\'un nouveau cycle. Avance, guerrier.',
    exercises: [mockExercises[4], mockExercises[5], mockExercises[2], mockExercises[3]],
    isCompleted: false
  },
  // Jaguar Breath program rituals would be here
  // Mohero Origin program rituals would be here
];
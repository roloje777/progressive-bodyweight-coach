export type ExerciseGuide = {
  title: string;
  image: string;
  description: string;
  category: string[]; // ✅ important
  muscles: {
    primary: string[];   // ✅ important
    secondary: string[]; // ✅ important
  };
  difficulty: number;
  effectiveness: number;
  steps: string[];   // ✅ important
  videoKey: string;
  videoUrl: string;
  safety: string[];  // ✅ important
};

export type ExerciseGuideMap = Record<string, ExerciseGuide>;
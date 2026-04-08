export interface ExerciseGuide {
  title: string;
  image: string;
  description: string;
  category: string[];
  muscles: {
    primary: string[];
    secondary: string[];
  };
  difficulty: number;     // 1–5
  effectiveness: number;  // 1–5
  steps: string[];
  videoKey: string;
  safety: string[];
}
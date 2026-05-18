export interface ExerciseDefinition {
  id: string;

  name: string;

  description?: string;

  type:
    | "reps"
    | "tempo"
    | "hold";

  family?: string;

  category?: string[];

  difficulty?: number;

  effectiveness?: number;

  progression?: {
    next?: string;
    regression?: string;
  };

  muscles?: {
    primary: string[];
    secondary: string[];
  };

  safety?: string[];

  steps?: string[];

  image?: string;

  videoUrl?: string;

  videoKey?: string;
}
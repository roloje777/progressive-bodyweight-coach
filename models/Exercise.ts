export type ExerciseType = "reps" | "hold" | "tempo";

export interface HoldConfig {
  durationSeconds: number; // e.g., Plank 45 sec
}

export interface TempoConfig {
  eccentric: number;       // seconds lowering the weight / body
  pauseBottom?: number;    // seconds at bottom (set to 0 if none)
  concentric: number;      // seconds lifting / returning
  pauseTop?: number;       // seconds at top (set to 0 if none)
  reps: number;
}

export interface RepConfig {
  reps: number;      // number of reps per set
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  sets: number;
  config: HoldConfig | TempoConfig | RepConfig;
}
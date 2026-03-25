export type ExerciseType = "reps" | "hold" | "tempo";

export interface HoldConfig {
  durationSeconds: number; // e.g., Plank 45 sec
}

export interface TempoConfig {
   startPhase: "eccentric" | "concentric";
  eccentric: number;       // seconds lowering the weight / body
  pauseEccentric?: number;    // seconds at bottom (set to 0 if none)
  concentric: number;      // seconds lifting / returning
  pauseConcentric?: number;       // seconds at top (set to 0 if none)
  minReps: number;
  maxReps: number;
 
}

export interface RepConfig {
  minReps: number
  maxReps: number
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: ExerciseType;
  sets: number;
  config: HoldConfig | TempoConfig | RepConfig;
}
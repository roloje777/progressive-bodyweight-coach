import { ExercisePerformanceProfile } from "./ExercisePerformanceProfile";

export type MatchOrBeatTarget = {
  setNumber: number;
  target: number;
};

export type ExerciseType = "reps" | "hold" | "tempo" | "time";

export type SideMode = "none" | "alternating";

export interface HoldConfig {
  durationSeconds: number;
}

export interface TempoConfig {
  startPhase: "eccentric" | "concentric";

  eccentric: number;

  pauseEccentric?: number;

  concentric: number;

  pauseConcentric?: number;

  minReps: number;

  maxReps: number;
}

export interface RepConfig {
  minReps: number;

  maxReps: number;
}

/**
 * MASTER REGISTRY EXERCISE
 * Stored once globally
 */
export interface ExerciseDefinition {
  id: string;

  name: string;

  type: ExerciseType;

  family: string;

  guideId: string;

  adaptive?: {
    progressionStyle: string;
  };
}

/**
 * EXERCISE INSTANCE INSIDE A PROGRAM
 */
export interface ProgramExercise {
  exerciseId: string;

  sets: number;

  description?: string;

  sideMode?: SideMode;

  config: HoldConfig | TempoConfig | RepConfig;

  matchOrBeatTargets?: MatchOrBeatTarget[];

  performanceProfile?: ExercisePerformanceProfile;
}

/**
 * FINAL RUNTIME EXERCISE
 * Registry + Program config merged
 */
export type HydratedExercise =
  ExerciseDefinition &
  ProgramExercise;
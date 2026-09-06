//models.Exercise.ts
import { ExercisePerformanceProfile } from "./ExercisePerformanceProfile";

export type MatchOrBeatTarget = {
  setNumber: number;
  target: number | null;
  source:
    | "historicalSameSet"
    | "historicalPreviousSet"
    | "currentWorkoutPreviousSet"
    | "configuredFallback"
    | "none"
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

  /** Hidden from the normal prescription until its adaptive trigger is earned. */
  optional?: boolean;

  /** Kept explicit so future adaptive triggers can coexist safely. */
  adaptiveTrigger?: "rating-5";

  /** Runtime-only: first accepted optional exposure establishes its MB baseline. */
  adaptiveBaselineOnly?: boolean;

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
export type HydratedExercise = ExerciseDefinition & ProgramExercise;

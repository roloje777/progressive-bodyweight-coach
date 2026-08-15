//models/WorkoutLog.ts
import { WorkoutStatus, ItemStatus } from "./WorkoutStatus";

export interface WorkoutFeedback {
  rating: number;

  tags?: string[];

  comment?: string;
}

export type CompletedSet = {
  setNumber: number;

  status: ItemStatus;

  reps?: number | { left: number; right: number };

  durationSeconds?: number;

  durationLeft?: number;

  durationRight?: number;

  phaseDurations?: number[];

  repsCompleted?: number;

  repsLeft?: number;

  repsRight?: number;
};

export type CompletedExercise = {
  exerciseId: string;

  sets: CompletedSet[];
};


export type CompletedSection = {
  completed: string[];
  skipped: string[];
  sectionSkipped: boolean;
};

export type WorkoutSession = {
  programId: string;
  dayId: string;

  exercises: CompletedExercise[];
};

export type CompletedSession = {
  programId: string;
  dayId: string;

  status?: WorkoutStatus;

  completedAt: string;

  startWorkoutTime: number;
  endWorkoutTime: number;

  workoutDuration: number;
  timeUnderTension: number;

  exercises: CompletedExercise[];

  feedback?: WorkoutFeedback;

  // Optional because older stored workouts do not have these yet.
  warmup?: CompletedSection;
  stretch?: CompletedSection;

  // Optional block timing information.
  warmupStartedAt?: number;
  warmupCompletedAt?: number;

  mainStartedAt?: number;
  mainCompletedAt?: number;

  stretchStartedAt?: number;
  stretchCompletedAt?: number;

  // Main workout section status.
  sectionSkipped?: boolean;
};


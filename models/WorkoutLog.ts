//models/WorkoutLog.ts
import { WorkoutStatus, ItemStatus } from "./WorkoutStatus";


export type TrainingMode =
  | "normal"
  | "deload-fatigue"
  | "deload-pain"
  | "deload-form"
  | "deload-recovery"
  | "verification";

export type DeloadWorkoutMetadata = {
  reason: "fatigue" | "pain" | "form" | "recovery";
  phase: "deload" | "verification";
  targetScale: number;
};


export type RecoveryActivityType =
  | "guided-mobility"
  | "walking"
  | "easy-cycling"
  | "mobility"
  | "other";

export type RecoveryActivity = {
  /** How the pain-recovery main block was completed. */
  type: RecoveryActivityType;

  /** Required for active recovery; omitted for guided mobility/stretch. */
  durationMinutes?: number;

  /** Optional active-recovery distance. */
  distance?: number;

  /** Unit used when distance is recorded. */
  distanceUnit?: "km" | "mi";

  /** Optional free-text label when type === "other". */
  notes?: string;

  completed: boolean;
};

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

  /**
   * Zero-based program week.
   *
   * Week 1 = 0
   * Week 2 = 1
   * Week 3 = 2
   */
  weekIndex?: number;

  /**
   * Zero-based day position inside the program week.
   *
   * Day 1 = 0
   * Day 2 = 1
   * Day 3 = 2
   */
  dayIndex?: number;

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

  /** Normal, deload, or post-deload verification exposure. */
  trainingMode?: TrainingMode;

  /** Metadata retained for coaching/history interpretation. */
  deload?: DeloadWorkoutMetadata;

  /** Pain-recovery activity retained as real recovery history. */
  recoveryActivity?: RecoveryActivity;
};

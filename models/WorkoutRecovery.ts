import { WorkoutSession as LiveWorkoutSession } from "@/engine/sessionBuilder";
import { WorkoutSession as EngineWorkoutSession } from "@/models/WorkoutLog";

export type WorkoutRecoveryScreen =
  | "dynamicWarmUp"
  | "workout"
  | "staticStretch"
  | "workoutSummary"
  | "coach";

export type RecoveryEntrySource = "live" | "manualRecovery";

export type ActiveTimingSegment = {
  startedAt: number;
  lastCheckpointAt: number;
};

export type RecoveryScreenState = {
  currentIndex?: number;
  completed?: string[];
  skipped?: string[];
  currentExerciseIndex?: number;
  sets?: any[];
  phase?: string;
  started?: boolean;
  sectionSkipped?: boolean;
  engineState?: {
    currentExerciseIndex: number;
    workoutLog: EngineWorkoutSession | null;
  };
};

export type ActiveWorkoutSnapshot = {
  version: 1;
  sessionId: string;
  createdAt: number;
  lastCheckpointAt: number;
  programId: string;
  weekIndex: number;
  dayIndex: number;
  startWorkoutTime: number;
  screen: WorkoutRecoveryScreen;
  blockIndex: number;
  session: LiveWorkoutSession;
  screenState?: RecoveryScreenState;
  accumulatedActiveDurationMs: number;
  activeTimingSegment: ActiveTimingSegment | null;
  blockActiveDurationMs: Record<string, number>;
  activeBlockId?: string;
};

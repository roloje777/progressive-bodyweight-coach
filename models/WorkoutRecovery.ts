import { WorkoutSession as LiveWorkoutSession } from "@/engine/sessionBuilder";
import { WorkoutSession as EngineWorkoutSession } from "@/models/WorkoutLog";

export type WorkoutRecoveryScreen =
  | "dynamicWarmUp"
  | "workout"
  | "staticStretch"
  | "workoutSummary"
  | "coach";

export type RecoveryEntrySource = "live" | "manualRecovery";

export type RecoveryAppState = "active" | "inactive" | "background" | "unknown";

export type RecoveryInterruptionKind =
  | "briefBackground"
  | "extendedBackground"
  | "processRestart";

export type RecoveryInterruption = {
  kind: RecoveryInterruptionKind;
  detectedAt: number;
  absenceMs?: number;
};

export type ActiveTimingSegment = {
  startedAt: number;
  lastCheckpointAt: number;
};

export type RecoveryTimerKind =
  | "rest-set"
  | "rest-exercise"
  | "countdown"
  | "hold";

export type RecoveryTimerState = {
  kind: RecoveryTimerKind;
  startedAt: number;
  durationSeconds: number;
  exerciseId?: string;
  setNumber?: number;

  /**
   * Hold-only metadata. Background/closed-app time is never added to this.
   */
  elapsedBeforeInterruption?: number;
  side?: "left" | "right";
  leftDurationSeconds?: number;
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
  timerState?: RecoveryTimerState | null;
  engineState?: {
    currentExerciseIndex: number;
    workoutLog: EngineWorkoutSession | null;
  };
};

/**
 * V2 active-workout recovery snapshot.
 *
 * Trusted workout time only advances while activeTimingSegment exists.
 * Background/closed-app gaps are represented by lifecycle metadata and are
 * never inferred to be active training time.
 */
export type ActiveWorkoutSnapshot = {
  version: 2;
  schemaVersion: 2;
  sessionId: string;
  createdAt: number;
  updatedAt: number;
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

  /** Runtime/process which currently owns this snapshot. */
  runtimeId: string;

  /** Last lifecycle state recorded by the workout checkpoint hook. */
  lastAppState: RecoveryAppState;

  /** Set when the app leaves the foreground; cleared after foreground resume. */
  backgroundedAt?: number;

  /** Most recent foreground transition for this workout. */
  lastForegroundedAt?: number;

  /** Most recent classified interruption/background absence. */
  interruption?: RecoveryInterruption;

  /**
   * True only while PBH has intentionally opened an external Exercise Guide
   * video. The resulting background interval is legitimate workout time.
   */
  countNextBackgroundAsActive?: boolean;
};

export type RecoverySnapshotAge = "recent" | "stale" | "veryStale";

export type RecoverySnapshotContext = {
  blockTitle?: string;
  blockType?: string;
  exerciseId?: string;
  exerciseName?: string;
  setNumber?: number;
};

export type RecoverySnapshotIntegrity = {
  age: RecoverySnapshotAge;
  ageMs: number;
  warnings: string[];
  context: RecoverySnapshotContext;
};

export type ActiveWorkoutLoadStatus = "none" | "ready" | "invalid";

export type ActiveWorkoutLoadResult = {
  status: ActiveWorkoutLoadStatus;
  snapshot: ActiveWorkoutSnapshot | null;
  migratedFromVersion?: number;
  issue?: string;
  integrity?: RecoverySnapshotIntegrity;
};

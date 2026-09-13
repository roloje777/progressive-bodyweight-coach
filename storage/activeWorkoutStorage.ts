import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActiveWorkoutLoadResult,
  ActiveWorkoutSnapshot,
  RecoveryAppState,
  RecoveryInterruptionKind,
  RecoverySnapshotIntegrity,
  RecoveryScreenState,
  RecoveryTimerState,
  WorkoutRecoveryScreen,
} from "@/models/WorkoutRecovery";
import { WorkoutSession } from "@/engine/sessionBuilder";
import { logRecoveryEvent } from "@/utils/recoveryDiagnostics";

const KEY_V2 = "ACTIVE_WORKOUT_RECOVERY_V2";
const LEGACY_KEY_V1 = "ACTIVE_WORKOUT_RECOVERY_V1";
const SNAPSHOT_VERSION = 2 as const;

/**
 * A module-level value changes when the JS process restarts, but remains stable
 * through ordinary background/foreground transitions in the same process.
 */
const CURRENT_RUNTIME_ID = `runtime:${Date.now()}:${Math.random().toString(36).slice(2)}`;

/** Internal classification only; intentionally not a user setting. */
const BRIEF_BACKGROUND_MAX_MS = 60_000;
const STALE_RECOVERY_MS = 24 * 60 * 60 * 1000;
const VERY_STALE_RECOVERY_MS = 7 * 24 * 60 * 60 * 1000;

const VALID_SCREENS: WorkoutRecoveryScreen[] = [
  "dynamicWarmUp",
  "workout",
  "staticStretch",
  "workoutSummary",
  "coach",
];

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonNegativeNumber(value: unknown, fallback = 0): number {
  return isFiniteNumber(value) ? Math.max(0, value) : fallback;
}

function isValidScreen(value: unknown): value is WorkoutRecoveryScreen {
  return typeof value === "string" && VALID_SCREENS.includes(value as WorkoutRecoveryScreen);
}

function normalizeDurationRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};

  return Object.entries(value).reduce<Record<string, number>>((acc, [key, duration]) => {
    if (isFiniteNumber(duration)) acc[key] = Math.max(0, duration);
    return acc;
  }, {});
}

function validateSession(value: unknown): value is WorkoutSession {
  return isRecord(value) && Array.isArray(value.blocks);
}


export function analyzeRecoverySnapshotIntegrity(
  snapshot: ActiveWorkoutSnapshot,
  now = Date.now(),
): { issue?: string; integrity: RecoverySnapshotIntegrity } {
  const warnings: string[] = [];
  const ageMs = Math.max(0, now - snapshot.updatedAt);
  const age =
    ageMs >= VERY_STALE_RECOVERY_MS
      ? "veryStale"
      : ageMs >= STALE_RECOVERY_MS
        ? "stale"
        : "recent";

  if (age === "stale") {
    warnings.push("This interrupted workout is more than 24 hours old.");
  } else if (age === "veryStale") {
    warnings.push("This interrupted workout is more than 7 days old. Confirm it is still the workout you want to continue.");
  }

  if (snapshot.session.dayIndex !== snapshot.dayIndex) {
    return {
      issue: "Recovery session day does not match the saved workout day.",
      integrity: { age, ageMs, warnings, context: {} },
    };
  }

  const currentBlock = snapshot.session.blocks[snapshot.blockIndex];

  if (snapshot.screen !== "workoutSummary") {
    if (!currentBlock) {
      return {
        issue: "Recovery screen points to a workout block that no longer exists.",
        integrity: { age, ageMs, warnings, context: {} },
      };
    }

    const expectedBlockType =
      snapshot.screen === "dynamicWarmUp"
        ? "warmup"
        : snapshot.screen === "workout"
          ? "main"
          : snapshot.screen === "staticStretch"
            ? "stretch"
            : undefined;

    if (expectedBlockType && currentBlock.type !== expectedBlockType) {
      return {
        issue: `Recovery screen ${snapshot.screen} does not match the saved ${currentBlock.type} block.`,
        integrity: { age, ageMs, warnings, context: {} },
      };
    }
  }

  const context: RecoverySnapshotIntegrity["context"] = {
    blockTitle: currentBlock?.title,
    blockType: currentBlock?.type,
  };

  if (snapshot.screen === "workout" && currentBlock?.type === "main") {
    const engineState = snapshot.screenState?.engineState;
    const exerciseIndex = engineState?.currentExerciseIndex;

    if (exerciseIndex != null) {
      if (
        !Number.isInteger(exerciseIndex)
        || exerciseIndex < 0
        || exerciseIndex >= currentBlock.exercises.length
      ) {
        return {
          issue: "Recovery exercise position is outside the saved workout prescription.",
          integrity: { age, ageMs, warnings, context },
        };
      }

      const exercise = currentBlock.exercises[exerciseIndex];
      const exerciseId = exercise?.exerciseId ?? exercise?.id;
      context.exerciseId = exerciseId;
      context.exerciseName = exercise?.name ?? exerciseId;

      const workoutLogProgramId = engineState?.workoutLog?.programId;
      if (workoutLogProgramId && workoutLogProgramId !== snapshot.programId) {
        return {
          issue: "Recovery workout log belongs to a different program.",
          integrity: { age, ageMs, warnings, context },
        };
      }

      const timerState = snapshot.screenState?.timerState;
      if (
        timerState?.exerciseId
        && exerciseId
        && timerState.exerciseId !== exerciseId
      ) {
        return {
          issue: "Recovery timer belongs to a different exercise than the saved workout position.",
          integrity: { age, ageMs, warnings, context },
        };
      }

      context.setNumber =
        timerState?.setNumber
        ?? ((snapshot.screenState?.sets?.length ?? 0) + 1);
    }
  }

  return {
    integrity: {
      age,
      ageMs,
      warnings,
      context,
    },
  };
}

export function validateRecoveryV2Snapshot(value: unknown): ActiveWorkoutLoadResult {
  if (!isRecord(value)) {
    return { status: "invalid", snapshot: null, issue: "Snapshot is not an object." };
  }

  if (value.version !== 2 || value.schemaVersion !== 2) {
    return {
      status: "invalid",
      snapshot: null,
      issue: `Unsupported recovery snapshot version: ${String(value.version ?? value.schemaVersion ?? "unknown")}.`,
    };
  }

  const requiredStringFields = ["sessionId", "programId", "runtimeId"] as const;
  for (const field of requiredStringFields) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      return { status: "invalid", snapshot: null, issue: `Missing or invalid ${field}.` };
    }
  }

  if (!isValidScreen(value.screen)) {
    return { status: "invalid", snapshot: null, issue: "Invalid recovery screen." };
  }

  if (!validateSession(value.session)) {
    return { status: "invalid", snapshot: null, issue: "Workout session data is missing or invalid." };
  }

  const numericFields = [
    "createdAt",
    "updatedAt",
    "lastCheckpointAt",
    "weekIndex",
    "dayIndex",
    "startWorkoutTime",
    "blockIndex",
    "accumulatedActiveDurationMs",
  ] as const;

  for (const field of numericFields) {
    if (!isFiniteNumber(value[field])) {
      return { status: "invalid", snapshot: null, issue: `Missing or invalid ${field}.` };
    }
  }

  if (value.weekIndex < 0 || value.dayIndex < 0 || value.blockIndex < 0) {
    return { status: "invalid", snapshot: null, issue: "Workout indices cannot be negative." };
  }

  if (value.session.blocks.length > 0) {
    /**
     * During active workout screens blockIndex must reference a real block.
     * workoutSummary intentionally uses session.blocks.length as a sentinel
     * meaning "all workout blocks are complete". V1 allowed that state; V2
     * validation must preserve it or the final trusted-duration checkpoint is
     * rejected and subsequent duration reads incorrectly fall back to zero.
     */
    const maxAllowedBlockIndex =
      value.screen === "workoutSummary"
        ? value.session.blocks.length
        : value.session.blocks.length - 1;

    if (value.blockIndex > maxAllowedBlockIndex) {
      return {
        status: "invalid",
        snapshot: null,
        issue: "Recovery block index is outside the workout session.",
      };
    }
  }

  const activeTimingSegment = isRecord(value.activeTimingSegment)
    && isFiniteNumber(value.activeTimingSegment.startedAt)
    && isFiniteNumber(value.activeTimingSegment.lastCheckpointAt)
    ? {
        startedAt: value.activeTimingSegment.startedAt,
        lastCheckpointAt: value.activeTimingSegment.lastCheckpointAt,
      }
    : null;

  const lastAppState: RecoveryAppState =
    value.lastAppState === "active"
      || value.lastAppState === "inactive"
      || value.lastAppState === "background"
      || value.lastAppState === "unknown"
      ? value.lastAppState
      : "unknown";

  const interruption = isRecord(value.interruption)
    && (value.interruption.kind === "briefBackground"
      || value.interruption.kind === "extendedBackground"
      || value.interruption.kind === "processRestart")
    && isFiniteNumber(value.interruption.detectedAt)
    ? {
        kind: value.interruption.kind,
        detectedAt: value.interruption.detectedAt,
        absenceMs: isFiniteNumber(value.interruption.absenceMs)
          ? Math.max(0, value.interruption.absenceMs)
          : undefined,
      }
    : undefined;

  const snapshot: ActiveWorkoutSnapshot = {
    ...value,
    version: SNAPSHOT_VERSION,
    schemaVersion: SNAPSHOT_VERSION,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    lastCheckpointAt: value.lastCheckpointAt,
    weekIndex: Math.max(0, Math.floor(value.weekIndex)),
    dayIndex: Math.max(0, Math.floor(value.dayIndex)),
    blockIndex: Math.max(0, Math.floor(value.blockIndex)),
    accumulatedActiveDurationMs: nonNegativeNumber(value.accumulatedActiveDurationMs),
    blockActiveDurationMs: normalizeDurationRecord(value.blockActiveDurationMs),
    activeTimingSegment,
    lastAppState,
    backgroundedAt: isFiniteNumber(value.backgroundedAt) ? value.backgroundedAt : undefined,
    lastForegroundedAt: isFiniteNumber(value.lastForegroundedAt)
      ? value.lastForegroundedAt
      : undefined,
    interruption,
  } as ActiveWorkoutSnapshot;

  const analyzed = analyzeRecoverySnapshotIntegrity(snapshot);
  if (analyzed.issue) {
    return {
      status: "invalid",
      snapshot: null,
      issue: analyzed.issue,
      integrity: analyzed.integrity,
    };
  }

  return {
    status: "ready",
    snapshot,
    integrity: analyzed.integrity,
  };
}

export function migrateRecoveryV1Snapshot(value: unknown): ActiveWorkoutLoadResult {
  if (!isRecord(value) || value.version !== 1) {
    return { status: "invalid", snapshot: null, issue: "Unsupported legacy recovery snapshot." };
  }

  if (
    typeof value.sessionId !== "string"
    || typeof value.programId !== "string"
    || !isValidScreen(value.screen)
    || !validateSession(value.session)
    || !isFiniteNumber(value.createdAt)
    || !isFiniteNumber(value.lastCheckpointAt)
    || !isFiniteNumber(value.weekIndex)
    || !isFiniteNumber(value.dayIndex)
    || !isFiniteNumber(value.startWorkoutTime)
    || !isFiniteNumber(value.blockIndex)
  ) {
    return {
      status: "invalid",
      snapshot: null,
      issue: "Legacy recovery snapshot is missing required workout data.",
    };
  }

  const migrated: ActiveWorkoutSnapshot = {
    version: SNAPSHOT_VERSION,
    schemaVersion: SNAPSHOT_VERSION,
    sessionId: value.sessionId,
    createdAt: value.createdAt,
    updatedAt: value.lastCheckpointAt,
    lastCheckpointAt: value.lastCheckpointAt,
    programId: value.programId,
    weekIndex: Math.max(0, Math.floor(value.weekIndex)),
    dayIndex: Math.max(0, Math.floor(value.dayIndex)),
    startWorkoutTime: value.startWorkoutTime,
    screen: value.screen,
    blockIndex: Math.max(0, Math.floor(value.blockIndex)),
    session: value.session,
    screenState: isRecord(value.screenState) ? value.screenState : undefined,
    accumulatedActiveDurationMs: nonNegativeNumber(value.accumulatedActiveDurationMs),
    activeTimingSegment: isRecord(value.activeTimingSegment)
      && isFiniteNumber(value.activeTimingSegment.startedAt)
      && isFiniteNumber(value.activeTimingSegment.lastCheckpointAt)
      ? {
          startedAt: value.activeTimingSegment.startedAt,
          lastCheckpointAt: value.activeTimingSegment.lastCheckpointAt,
        }
      : null,
    blockActiveDurationMs: normalizeDurationRecord(value.blockActiveDurationMs),
    activeBlockId: typeof value.activeBlockId === "string" ? value.activeBlockId : undefined,

    // A V1 snapshot necessarily belongs to an earlier build/runtime. Giving it
    // a legacy runtime id ensures startup classifies it as process recovery.
    runtimeId: `legacy-v1:${value.sessionId}`,
    lastAppState: "unknown",
  };

  const analyzed = analyzeRecoverySnapshotIntegrity(migrated);
  if (analyzed.issue) {
    return {
      status: "invalid",
      snapshot: null,
      issue: analyzed.issue,
      integrity: analyzed.integrity,
      migratedFromVersion: 1,
    };
  }

  return {
    status: "ready",
    snapshot: migrated,
    migratedFromVersion: 1,
    integrity: analyzed.integrity,
  };
}

async function persistSnapshot(snapshot: ActiveWorkoutSnapshot): Promise<void> {
  await AsyncStorage.setItem(KEY_V2, JSON.stringify(snapshot));
}

function freezeInterruptedPerformanceTimer(
  snapshot: ActiveWorkoutSnapshot,
  cutoffAt: number,
): ActiveWorkoutSnapshot {
  const screenState = snapshot.screenState;
  const timerState = screenState?.timerState as RecoveryTimerState | null | undefined;

  if (!screenState || !timerState || timerState.kind !== "hold") {
    return snapshot;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.min(
      timerState.durationSeconds,
      Math.floor((cutoffAt - timerState.startedAt) / 1000),
    ),
  );

  return {
    ...snapshot,
    screenState: {
      ...screenState,
      timerState: {
        ...timerState,
        elapsedBeforeInterruption: Math.max(
          timerState.elapsedBeforeInterruption ?? 0,
          elapsedSeconds,
        ),
      },
    },
  };
}

/**
 * Reads, validates, and if necessary migrates the persisted recovery snapshot.
 * Invalid data is deliberately left in storage so the recovery UI can explain
 * the problem and let the user explicitly discard it.
 */
export async function inspectActiveWorkout(): Promise<ActiveWorkoutLoadResult> {
  try {
    const rawV2 = await AsyncStorage.getItem(KEY_V2);
    if (rawV2) {
      try {
        const result = validateRecoveryV2Snapshot(JSON.parse(rawV2));
        if (result.status === "invalid") {
          void logRecoveryEvent("snapshot_invalid", { issue: result.issue });
        }
        return result;
      } catch {
        return { status: "invalid", snapshot: null, issue: "Recovery snapshot JSON is corrupted." };
      }
    }

    const rawV1 = await AsyncStorage.getItem(LEGACY_KEY_V1);
    if (!rawV1) return { status: "none", snapshot: null };

    try {
      const migrated = migrateRecoveryV1Snapshot(JSON.parse(rawV1));
      if (migrated.status === "ready" && migrated.snapshot) {
        await persistSnapshot(migrated.snapshot);
        await AsyncStorage.removeItem(LEGACY_KEY_V1);
        void logRecoveryEvent("snapshot_migrated", {
          fromVersion: 1,
          toVersion: SNAPSHOT_VERSION,
          sessionId: migrated.snapshot.sessionId,
        });
      }
      return migrated;
    } catch {
      return { status: "invalid", snapshot: null, issue: "Legacy recovery snapshot JSON is corrupted." };
    }
  } catch (error) {
    console.error("Failed to inspect active workout", error);
    return { status: "invalid", snapshot: null, issue: "Recovery storage could not be read." };
  }
}

export async function loadActiveWorkout(): Promise<ActiveWorkoutSnapshot | null> {
  const result = await inspectActiveWorkout();
  return result.status === "ready" ? result.snapshot : null;
}

export async function clearActiveWorkout(reason = "unspecified"): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEY_V2),
    AsyncStorage.removeItem(LEGACY_KEY_V1),
  ]);
  void logRecoveryEvent("snapshot_cleared", { reason });
}

/**
 * Clears a recovery snapshot only when it is still the session the caller
 * expects. This prevents a late completion/discard callback from deleting a
 * newer workout that may have started meanwhile.
 */
export async function clearActiveWorkoutIfSession(
  expectedSessionId: string,
): Promise<boolean> {
  const current = await loadActiveWorkout();
  if (!current || current.sessionId !== expectedSessionId) {
    void logRecoveryEvent("snapshot_clear_skipped", {
      expectedSessionId,
      actualSessionId: current?.sessionId,
    });
    return false;
  }

  await clearActiveWorkout("session_match");
  return true;
}

function checkpointTiming(snapshot: ActiveWorkoutSnapshot, now: number) {
  const segment = snapshot.activeTimingSegment;
  if (!segment) return snapshot;

  const delta = Math.max(0, now - segment.lastCheckpointAt);
  const activeBlockId = snapshot.activeBlockId;

  return {
    ...snapshot,
    accumulatedActiveDurationMs: snapshot.accumulatedActiveDurationMs + delta,
    blockActiveDurationMs: activeBlockId
      ? {
          ...snapshot.blockActiveDurationMs,
          [activeBlockId]: (snapshot.blockActiveDurationMs[activeBlockId] ?? 0) + delta,
        }
      : snapshot.blockActiveDurationMs,
    activeTimingSegment: { ...segment, lastCheckpointAt: now },
    lastCheckpointAt: now,
    updatedAt: now,
  };
}

export async function createActiveWorkout(input: {
  programId: string;
  weekIndex: number;
  dayIndex: number;
  startWorkoutTime: number;
  session: WorkoutSession;
}): Promise<ActiveWorkoutSnapshot> {
  const now = Date.now();
  const firstBlock = input.session.blocks[0];
  const snapshot: ActiveWorkoutSnapshot = {
    version: SNAPSHOT_VERSION,
    schemaVersion: SNAPSHOT_VERSION,
    sessionId: `${input.programId}:${input.weekIndex}:${input.dayIndex}:${now}`,
    createdAt: now,
    updatedAt: now,
    lastCheckpointAt: now,
    programId: input.programId,
    weekIndex: input.weekIndex,
    dayIndex: input.dayIndex,
    startWorkoutTime: input.startWorkoutTime,
    screen: firstBlock?.type === "warmup" ? "dynamicWarmUp" : "workout",
    blockIndex: 0,
    session: input.session,
    accumulatedActiveDurationMs: 0,
    activeTimingSegment: { startedAt: now, lastCheckpointAt: now },
    blockActiveDurationMs: {},
    activeBlockId: firstBlock?.id,
    runtimeId: CURRENT_RUNTIME_ID,
    lastAppState: "active",
    lastForegroundedAt: now,
  };
  await persistSnapshot(snapshot);
  void logRecoveryEvent("snapshot_created", {
    sessionId: snapshot.sessionId,
    programId: snapshot.programId,
    weekIndex: snapshot.weekIndex,
    dayIndex: snapshot.dayIndex,
    screen: snapshot.screen,
    blockIndex: snapshot.blockIndex,
  });
  return snapshot;
}

/**
 * Called once by the recovery gate when a new app runtime starts. If the
 * persisted snapshot belongs to another runtime, the workout is classified as
 * a true process-restart interruption. Crucially, any previously-open timing
 * segment is closed WITHOUT checkpointing to now, so offline time cannot leak
 * into trusted duration.
 */
export async function prepareActiveWorkoutForRuntime(): Promise<ActiveWorkoutLoadResult> {
  const result = await inspectActiveWorkout();
  if (result.status !== "ready" || !result.snapshot) return result;

  const snapshot = result.snapshot;
  if (snapshot.runtimeId === CURRENT_RUNTIME_ID) return result;

  const now = Date.now();
  const absenceStart = snapshot.backgroundedAt ?? snapshot.lastCheckpointAt;

  // A performance timer (hold) may only receive credit through the last trusted
  // checkpoint from the old runtime. Time after that boundary is unknown and
  // must never be manufactured as exercise performance.
  const frozenSnapshot = freezeInterruptedPerformanceTimer(
    snapshot,
    snapshot.lastCheckpointAt,
  );

  const next: ActiveWorkoutSnapshot = {
    ...frozenSnapshot,
    runtimeId: CURRENT_RUNTIME_ID,
    updatedAt: now,
    activeTimingSegment: null,
    lastAppState: "active",
    lastForegroundedAt: now,
    interruption: {
      kind: "processRestart",
      detectedAt: now,
      absenceMs: Math.max(0, now - absenceStart),
    },
  };

  await persistSnapshot(next);
  void logRecoveryEvent("process_restart_detected", {
    sessionId: next.sessionId,
    absenceMs: next.interruption?.absenceMs,
    screen: next.screen,
    blockIndex: next.blockIndex,
  });
  return { ...result, snapshot: next };
}

export async function checkpointActiveWorkout(update: {
  screen?: WorkoutRecoveryScreen;
  blockIndex?: number;
  session?: WorkoutSession;
  screenState?: RecoveryScreenState;
  activeBlockId?: string;
} = {}): Promise<ActiveWorkoutSnapshot | null> {
  const current = await loadActiveWorkout();
  if (!current) return null;
  const now = Date.now();
  const timed = checkpointTiming(current, now);
  const next: ActiveWorkoutSnapshot = {
    ...timed,
    ...update,
    updatedAt: now,
    lastCheckpointAt: now,
  };
  await persistSnapshot(next);
  return next;
}

export async function pauseActiveWorkout(
  appState: Exclude<RecoveryAppState, "active"> = "background",
): Promise<ActiveWorkoutSnapshot | null> {
  const current = await checkpointActiveWorkout();
  if (!current) return null;

  const now = Date.now();
  const frozenCurrent = freezeInterruptedPerformanceTimer(current, now);
  const next: ActiveWorkoutSnapshot = {
    ...frozenCurrent,
    updatedAt: now,
    activeTimingSegment: null,
    lastAppState: appState,
    backgroundedAt: current.backgroundedAt ?? now,
  };
  await persistSnapshot(next);
  void logRecoveryEvent("snapshot_paused", {
    sessionId: next.sessionId,
    appState,
    screen: next.screen,
    blockIndex: next.blockIndex,
  });
  return next;
}

export async function resumeActiveWorkout(): Promise<ActiveWorkoutSnapshot | null> {
  const current = await loadActiveWorkout();
  if (!current) return null;
  const now = Date.now();
  const absenceMs = current.backgroundedAt != null
    ? Math.max(0, now - current.backgroundedAt)
    : undefined;

  let interruption = current.interruption;
  if (absenceMs != null && current.interruption?.kind !== "processRestart") {
    const kind: RecoveryInterruptionKind =
      absenceMs <= BRIEF_BACKGROUND_MAX_MS ? "briefBackground" : "extendedBackground";
    interruption = { kind, detectedAt: now, absenceMs };
  }

  const next: ActiveWorkoutSnapshot = {
    ...current,
    runtimeId: CURRENT_RUNTIME_ID,
    updatedAt: now,
    lastCheckpointAt: now,
    activeTimingSegment: { startedAt: now, lastCheckpointAt: now },
    lastAppState: "active",
    backgroundedAt: undefined,
    lastForegroundedAt: now,
    interruption,
  };
  await persistSnapshot(next);
  void logRecoveryEvent("snapshot_resumed", {
    sessionId: next.sessionId,
    interruptionKind: next.interruption?.kind,
    absenceMs: next.interruption?.absenceMs,
    screen: next.screen,
    blockIndex: next.blockIndex,
  });
  return next;
}

export async function getTrustedWorkoutDurationSeconds(): Promise<number> {
  const current = await checkpointActiveWorkout();
  return Math.max(0, Math.floor((current?.accumulatedActiveDurationMs ?? 0) / 1000));
}

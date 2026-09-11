import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActiveWorkoutSnapshot, RecoveryScreenState, WorkoutRecoveryScreen } from "@/models/WorkoutRecovery";
import { WorkoutSession } from "@/engine/sessionBuilder";

const KEY = "ACTIVE_WORKOUT_RECOVERY_V1";

export async function loadActiveWorkout(): Promise<ActiveWorkoutSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveWorkoutSnapshot) : null;
  } catch (error) {
    console.error("Failed to load active workout", error);
    return null;
  }
}

export async function clearActiveWorkout(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
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
    version: 1,
    sessionId: `${input.programId}:${input.weekIndex}:${input.dayIndex}:${now}`,
    createdAt: now,
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
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
  return snapshot;
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
    lastCheckpointAt: now,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function pauseActiveWorkout(): Promise<ActiveWorkoutSnapshot | null> {
  const current = await checkpointActiveWorkout();
  if (!current) return null;
  const next = { ...current, activeTimingSegment: null };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function resumeActiveWorkout(): Promise<ActiveWorkoutSnapshot | null> {
  const current = await loadActiveWorkout();
  if (!current) return null;
  const now = Date.now();
  const next = {
    ...current,
    lastCheckpointAt: now,
    activeTimingSegment: { startedAt: now, lastCheckpointAt: now },
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function getTrustedWorkoutDurationSeconds(): Promise<number> {
  const current = await checkpointActiveWorkout();
  return Math.max(0, Math.floor((current?.accumulatedActiveDurationMs ?? 0) / 1000));
}

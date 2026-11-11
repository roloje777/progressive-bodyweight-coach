// storage/progressStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActiveDeload, ActiveMaintenance, ActiveRepeatWeek, PendingGraduation } from "@/models/ProgramProgress";
import { AdaptiveProgramState } from "@/models/AdaptiveVolume";

const KEY = "USER_PROGRESS";

export type WorkoutProgress = {
  completedSets: number;
  totalSets: number;
  completed: boolean;
};

export type ProgressState = {
  programIndex: number;

  week: number;

  day: number;

  workouts: {
    [key: string]: WorkoutProgress;
    // key = `${programIndex}-${week}-${day}`
  };

  /**
   * Graduation has been earned by the Coach,
   * but the user has not yet chosen whether to
   * progress or train another week.
   *
   * Optional for backward compatibility with
   * older stored progress.
   */
  pendingGraduation?: PendingGraduation | null;

  /**
   * Optional repeat-week marker created when the user chooses
   * "Train Another Week" after graduation readiness.
   */
  activeRepeatWeek?: ActiveRepeatWeek | null;

  /** Explicit marker for an unlocked open-ended maintenance phase. */
  activeMaintenance?: ActiveMaintenance | null;

  /** Active recovery intervention, if any. */
  activeDeload?: ActiveDeload | null;

  /**
   * Persisted user-specific normal prescription adaptations.
   * Optional for backward compatibility with existing USER_PROGRESS payloads.
   */
  adaptiveVolume?: AdaptiveProgramState;
};

// Serialize progress writes: multiple React state updates (week, day, deload)
// can otherwise complete out of order and restore a stale Verification cursor.
// A failed write must not permanently poison subsequent writes.
let pendingWrite: Promise<void> = Promise.resolve();

export const saveProgress = (progress: ProgressState): Promise<void> => {
  const payload = JSON.stringify(progress);
  const write = pendingWrite.catch(() => undefined).then(() =>
    AsyncStorage.setItem(KEY, payload),
  );
  pendingWrite = write;
  return write;
};

export const loadProgress = async (): Promise<ProgressState | null> => {
  // Focus refreshes must never read before a previously queued save finishes.
  await pendingWrite.catch(() => undefined);
  const data = await AsyncStorage.getItem(KEY);
  return data ? (JSON.parse(data) as ProgressState) : null;
};
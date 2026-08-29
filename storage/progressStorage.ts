// storage/progressStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActiveDeload, PendingGraduation } from "@/models/ProgramProgress";

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

  /** Active recovery intervention, if any. */
  activeDeload?: ActiveDeload | null;
};

export const saveProgress = async (
  progress: ProgressState,
): Promise<void> => {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(progress),
  );
};

export const loadProgress =
  async (): Promise<ProgressState | null> => {
    const data =
      await AsyncStorage.getItem(KEY);

    return data
      ? (JSON.parse(data) as ProgressState)
      : null;
  };
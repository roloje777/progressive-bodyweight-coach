// storage/workoutStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CompletedSession } from "../models/WorkoutLog";

const WORKOUT_HISTORY_KEY = "workout_history";

/**
 * -------------------------------------------------------
 * WORKOUT IDENTITY
 * -------------------------------------------------------
 *
 * New workouts are uniquely identified by:
 *
 * programId
 * + weekIndex
 * + dayIndex
 *
 * Older stored workouts may not contain weekIndex or
 * dayIndex, so duplicate protection only applies when
 * both sessions contain the new lifecycle identity.
 */
function isSameWorkoutIdentity(
  a: CompletedSession,
  b: CompletedSession,
): boolean {
  if (
    a.weekIndex == null ||
    a.dayIndex == null ||
    b.weekIndex == null ||
    b.dayIndex == null
  ) {
    return false;
  }

  return (
    a.programId === b.programId &&
    a.weekIndex === b.weekIndex &&
    a.dayIndex === b.dayIndex
  );
}

/**
 * Save a workout session.
 *
 * A completed workout with the same lifecycle identity
 * must not be stored twice.
 */
export const saveWorkoutSession = async (
  session: CompletedSession,
): Promise<boolean> => {
  try {
    const existing =
      await AsyncStorage.getItem(
        WORKOUT_HISTORY_KEY,
      );

    const history: CompletedSession[] =
      existing
        ? JSON.parse(existing)
        : [];

    // -----------------------------------
    // DUPLICATE PROTECTION
    // -----------------------------------

    const duplicate =
      history.some(
        (savedSession) =>
          isSameWorkoutIdentity(
            savedSession,
            session,
          ),
      );

    if (duplicate) {
      console.warn(
        "⚠️ Duplicate workout not saved",
        {
          programId:
            session.programId,

          weekIndex:
            session.weekIndex,

          dayIndex:
            session.dayIndex,

          dayId:
            session.dayId,
        },
      );

      return false;
    }

    // -----------------------------------
    // SAVE
    // -----------------------------------

    const updatedHistory = [
      ...history,
      session,
    ];

    await AsyncStorage.setItem(
      WORKOUT_HISTORY_KEY,
      JSON.stringify(
        updatedHistory,
      ),
    );

    console.log(
      "✅ Workout session saved",
      {
        programId:
          session.programId,

        weekIndex:
          session.weekIndex,

        dayIndex:
          session.dayIndex,

        dayId:
          session.dayId,

        totalSessions:
          updatedHistory.length,
      },
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to save workout:",
      error,
    );

    return false;
  }
};

/**
 * Retrieve full workout history.
 */
export const getWorkoutHistory =
  async (): Promise<
    CompletedSession[]
  > => {
    try {
      const data =
        await AsyncStorage.getItem(
          WORKOUT_HISTORY_KEY,
        );

      return data
        ? JSON.parse(data)
        : [];
    } catch (error) {
      console.error(
        "Failed to load history:",
        error,
      );

      return [];
    }
  };
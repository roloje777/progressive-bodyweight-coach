//storage/workoutStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CompletedSession } from "../models/WorkoutLog"; // adjust path if needed

const WORKOUT_HISTORY_KEY = "workout_history";

/**
 * Save a workout session
 */
export const saveWorkoutSession = async (
 session: CompletedSession
) => {
  try {
    const existing = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);

    const history: CompletedSession[] = existing
      ? JSON.parse(existing)
      : [];

    history.push(session);

    await AsyncStorage.setItem(
      WORKOUT_HISTORY_KEY,
      JSON.stringify(history)
    );

    console.log("Workout session saved. Total sessions:", history.length);
  } catch (error) {
    console.error("Failed to save workout:", error);
  }
};

/**
 * Retrieve full workout history
 */
export const getWorkoutHistory = async (): Promise<
  CompletedSession[]
> => {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
};


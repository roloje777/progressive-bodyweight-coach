import AsyncStorage from "@react-native-async-storage/async-storage";
import { CompletedWorkout } from "../models/WorkoutLog"; // adjust path if needed

const WORKOUT_HISTORY_KEY = "workout_history";

/**
 * Save a completed workout
 */
export const saveCompletedWorkout = async (
  workout: CompletedWorkout
) => {
  try {
    const existing = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);

    const history: CompletedWorkout[] = existing
      ? JSON.parse(existing)
      : [];

    history.push(workout);

    await AsyncStorage.setItem(
      WORKOUT_HISTORY_KEY,
      JSON.stringify(history)
    );

    console.log("Workout saved. Total sessions:", history.length);
  } catch (error) {
    console.error("Failed to save workout:", error);
  }
};

/**
 * Retrieve full workout history
 */
export const getWorkoutHistory = async (): Promise<
  CompletedWorkout[]
> => {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
};
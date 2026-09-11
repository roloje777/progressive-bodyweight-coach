import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_WORKOUT_RECOVERY_CONFIG,
  normalizeWorkoutRecoveryConfig,
  WorkoutRecoveryConfig,
} from "@/config/WorkoutRecoveryConfig";

const KEY = "WORKOUT_RECOVERY_SETTINGS";

export async function loadWorkoutRecoverySettings(): Promise<WorkoutRecoveryConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return normalizeWorkoutRecoveryConfig(raw ? JSON.parse(raw) : undefined);
  } catch (error) {
    console.error("Failed to load workout recovery settings", error);
    return DEFAULT_WORKOUT_RECOVERY_CONFIG;
  }
}

export async function saveWorkoutRecoverySettings(
  config: WorkoutRecoveryConfig,
): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(normalizeWorkoutRecoveryConfig(config)),
  );
}

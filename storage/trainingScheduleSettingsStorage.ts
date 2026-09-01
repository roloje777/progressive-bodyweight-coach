// storage/trainingScheduleSettingsStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_TRAINING_SCHEDULE_CONFIG,
  normalizeTrainingScheduleConfig,
  TrainingScheduleConfig,
} from "@/config/TrainingScheduleConfig";

const TRAINING_SCHEDULE_SETTINGS_KEY = "TRAINING_SCHEDULE_SETTINGS";

export async function loadTrainingScheduleSettings(): Promise<TrainingScheduleConfig> {
  try {
    const raw = await AsyncStorage.getItem(TRAINING_SCHEDULE_SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_TRAINING_SCHEDULE_CONFIG;
    }

    const parsed = JSON.parse(raw) as Partial<TrainingScheduleConfig>;

    // Always normalize persisted data so older/corrupt values can never
    // reduce the mandatory pain-recovery safety minimum.
    return normalizeTrainingScheduleConfig(parsed);
  } catch (error) {
    console.error("Failed to load training schedule settings", error);

    return DEFAULT_TRAINING_SCHEDULE_CONFIG;
  }
}

export async function saveTrainingScheduleSettings(
  config: TrainingScheduleConfig,
): Promise<void> {
  const normalized = normalizeTrainingScheduleConfig(config);

  await AsyncStorage.setItem(
    TRAINING_SCHEDULE_SETTINGS_KEY,
    JSON.stringify(normalized),
  );
}

export async function restoreDefaultTrainingScheduleSettings(): Promise<TrainingScheduleConfig> {
  const defaults = normalizeTrainingScheduleConfig(
    DEFAULT_TRAINING_SCHEDULE_CONFIG,
  );

  await AsyncStorage.setItem(
    TRAINING_SCHEDULE_SETTINGS_KEY,
    JSON.stringify(defaults),
  );

  return defaults;
}

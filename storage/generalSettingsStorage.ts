import AsyncStorage from "@react-native-async-storage/async-storage";

export type GeneralSettings = {
  week1BaselineCoachEnabled: boolean;
  preventBackNavigationDuringWorkout: boolean;
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  week1BaselineCoachEnabled: true,
  preventBackNavigationDuringWorkout: true,
};

const GENERAL_SETTINGS_KEY = "GENERAL_SETTINGS";

export async function loadGeneralSettings(): Promise<GeneralSettings> {
  try {
    const raw = await AsyncStorage.getItem(GENERAL_SETTINGS_KEY);
    if (!raw) return DEFAULT_GENERAL_SETTINGS;
    return { ...DEFAULT_GENERAL_SETTINGS, ...(JSON.parse(raw) as Partial<GeneralSettings>) };
  } catch (error) {
    console.error("Failed to load general settings", error);
    return DEFAULT_GENERAL_SETTINGS;
  }
}

export async function saveGeneralSettings(settings: GeneralSettings): Promise<void> {
  await AsyncStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify(settings));
}

export async function restoreDefaultGeneralSettings(): Promise<GeneralSettings> {
  await saveGeneralSettings(DEFAULT_GENERAL_SETTINGS);
  return DEFAULT_GENERAL_SETTINGS;
}

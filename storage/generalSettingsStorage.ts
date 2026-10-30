import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";
export type LanguagePreference = "system" | "en" | "pt-PT";

export type GeneralSettings = {
  contextualTipsEnabled: boolean;
  seenContextualTips: string[];
  week1BaselineCoachEnabled: boolean;
  preventBackNavigationDuringWorkout: boolean;
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
  recoveryEnforcement: "suggested" | "compulsory";
  compulsoryRetryRecoveryEnabled: boolean;
  compulsoryRetryRecoveryHours: 12 | 24 | 48;
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  contextualTipsEnabled: true,
  seenContextualTips: [],
  week1BaselineCoachEnabled: true,
  preventBackNavigationDuringWorkout: true,
  themePreference: "system",
  languagePreference: "system",
  recoveryEnforcement: "compulsory",
  compulsoryRetryRecoveryEnabled: false,
  compulsoryRetryRecoveryHours: 24,
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

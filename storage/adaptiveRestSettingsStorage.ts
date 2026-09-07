// storage/adaptiveRestSettingsStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  AdaptiveRestConfig,
  DEFAULT_ADAPTIVE_REST_CONFIG,
  normalizeAdaptiveRestConfig,
} from "@/config/AdaptiveRestConfig";

const ADAPTIVE_REST_SETTINGS_KEY = "ADAPTIVE_REST_SETTINGS";

export async function loadAdaptiveRestSettings(): Promise<AdaptiveRestConfig> {
  try {
    const raw = await AsyncStorage.getItem(ADAPTIVE_REST_SETTINGS_KEY);

    if (!raw) {
      return normalizeAdaptiveRestConfig(DEFAULT_ADAPTIVE_REST_CONFIG);
    }

    const parsed = JSON.parse(raw) as Partial<AdaptiveRestConfig>;
    return normalizeAdaptiveRestConfig(parsed);
  } catch (error) {
    console.error("Failed to load adaptive rest settings", error);
    return normalizeAdaptiveRestConfig(DEFAULT_ADAPTIVE_REST_CONFIG);
  }
}

export async function saveAdaptiveRestSettings(
  config: AdaptiveRestConfig,
): Promise<void> {
  const normalized = normalizeAdaptiveRestConfig(config);

  await AsyncStorage.setItem(
    ADAPTIVE_REST_SETTINGS_KEY,
    JSON.stringify(normalized),
  );
}

export async function restoreDefaultAdaptiveRestSettings(): Promise<AdaptiveRestConfig> {
  const defaults = normalizeAdaptiveRestConfig(DEFAULT_ADAPTIVE_REST_CONFIG);

  await AsyncStorage.setItem(
    ADAPTIVE_REST_SETTINGS_KEY,
    JSON.stringify(defaults),
  );

  return defaults;
}

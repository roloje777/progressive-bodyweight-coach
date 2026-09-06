// storage/adaptiveVolumeSettingsStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  AdaptiveVolumeConfig,
  DEFAULT_ADAPTIVE_VOLUME_CONFIG,
  normalizeAdaptiveVolumeConfig,
} from "@/config/AdaptiveVolumeConfig";

const ADAPTIVE_VOLUME_SETTINGS_KEY = "ADAPTIVE_VOLUME_SETTINGS";

export async function loadAdaptiveVolumeSettings(): Promise<AdaptiveVolumeConfig> {
  try {
    const raw = await AsyncStorage.getItem(ADAPTIVE_VOLUME_SETTINGS_KEY);

    if (!raw) {
      return normalizeAdaptiveVolumeConfig(DEFAULT_ADAPTIVE_VOLUME_CONFIG);
    }

    const parsed = JSON.parse(raw) as Partial<AdaptiveVolumeConfig>;
    return normalizeAdaptiveVolumeConfig(parsed);
  } catch (error) {
    console.error("Failed to load adaptive volume settings", error);
    return normalizeAdaptiveVolumeConfig(DEFAULT_ADAPTIVE_VOLUME_CONFIG);
  }
}

export async function saveAdaptiveVolumeSettings(
  config: AdaptiveVolumeConfig,
): Promise<void> {
  const normalized = normalizeAdaptiveVolumeConfig(config);

  await AsyncStorage.setItem(
    ADAPTIVE_VOLUME_SETTINGS_KEY,
    JSON.stringify(normalized),
  );
}

export async function restoreDefaultAdaptiveVolumeSettings(): Promise<AdaptiveVolumeConfig> {
  const defaults = normalizeAdaptiveVolumeConfig(
    DEFAULT_ADAPTIVE_VOLUME_CONFIG,
  );

  await AsyncStorage.setItem(
    ADAPTIVE_VOLUME_SETTINGS_KEY,
    JSON.stringify(defaults),
  );

  return defaults;
}

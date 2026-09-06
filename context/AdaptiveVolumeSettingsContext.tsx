// context/AdaptiveVolumeSettingsContext.tsx

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  AdaptiveVolumeConfig,
  DEFAULT_ADAPTIVE_VOLUME_CONFIG,
  MAXIMUM_ADAPTIVE_START_WEEK,
  MINIMUM_ADAPTIVE_START_WEEK,
  MINIMUM_WEEKLY_QUALIFYING_RATINGS,
  normalizeAdaptiveVolumeConfig,
} from "@/config/AdaptiveVolumeConfig";
import {
  loadAdaptiveVolumeSettings,
  saveAdaptiveVolumeSettings,
} from "@/storage/adaptiveVolumeSettingsStorage";

type AdaptiveVolumeSettingsContextValue = {
  adaptiveVolumeConfig: AdaptiveVolumeConfig;
  isLoaded: boolean;

  setAdaptiveVolumeEnabled: (enabled: boolean) => void;
  setAdaptiveStartWeek: (week: number) => void;
  setAdaptiveWeeklyQualifyingRatingCount: (count: number) => void;
  restoreAdaptiveVolumeDefaults: () => void;
};

const AdaptiveVolumeSettingsContext = createContext<
  AdaptiveVolumeSettingsContextValue | undefined
>(undefined);

type AdaptiveVolumeSettingsProviderProps = {
  children: ReactNode;
};

export function AdaptiveVolumeSettingsProvider({
  children,
}: AdaptiveVolumeSettingsProviderProps) {
  const [adaptiveVolumeConfig, setAdaptiveVolumeConfig] =
    useState<AdaptiveVolumeConfig>(
      normalizeAdaptiveVolumeConfig(DEFAULT_ADAPTIVE_VOLUME_CONFIG),
    );

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = await loadAdaptiveVolumeSettings();
      setAdaptiveVolumeConfig(saved);
      setIsLoaded(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveAdaptiveVolumeSettings(adaptiveVolumeConfig).catch((error) => {
      console.error("Failed to save adaptive volume settings", error);
    });
  }, [adaptiveVolumeConfig, isLoaded]);

  const setAdaptiveVolumeEnabled = (enabled: boolean) => {
    setAdaptiveVolumeConfig((current) =>
      normalizeAdaptiveVolumeConfig({
        ...current,
        enabled,
      }),
    );
  };

  const setAdaptiveStartWeek = (week: number) => {
    const clamped = Math.min(
      MAXIMUM_ADAPTIVE_START_WEEK,
      Math.max(MINIMUM_ADAPTIVE_START_WEEK, Math.round(week)),
    );

    setAdaptiveVolumeConfig((current) =>
      normalizeAdaptiveVolumeConfig({
        ...current,
        startWeek: clamped,
      }),
    );
  };

  const setAdaptiveWeeklyQualifyingRatingCount = (count: number) => {
    setAdaptiveVolumeConfig((current) =>
      normalizeAdaptiveVolumeConfig({
        ...current,
        weeklyQualifyingRatingCount: Math.max(
          MINIMUM_WEEKLY_QUALIFYING_RATINGS,
          Math.round(count),
        ),
      }),
    );
  };

  const restoreAdaptiveVolumeDefaults = () => {
    setAdaptiveVolumeConfig(
      normalizeAdaptiveVolumeConfig(DEFAULT_ADAPTIVE_VOLUME_CONFIG),
    );
  };

  return (
    <AdaptiveVolumeSettingsContext.Provider
      value={{
        adaptiveVolumeConfig,
        isLoaded,
        setAdaptiveVolumeEnabled,
        setAdaptiveStartWeek,
        setAdaptiveWeeklyQualifyingRatingCount,
        restoreAdaptiveVolumeDefaults,
      }}
    >
      {children}
    </AdaptiveVolumeSettingsContext.Provider>
  );
}

export function useAdaptiveVolumeSettingsContext() {
  const context = useContext(AdaptiveVolumeSettingsContext);

  if (!context) {
    throw new Error(
      "useAdaptiveVolumeSettings must be used inside AdaptiveVolumeSettingsProvider",
    );
  }

  return context;
}

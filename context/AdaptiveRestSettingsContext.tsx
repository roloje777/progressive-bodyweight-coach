// context/AdaptiveRestSettingsContext.tsx

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  AdaptiveRestConfig,
  AdaptiveRestMode,
  DEFAULT_ADAPTIVE_REST_CONFIG,
  normalizeAdaptiveRestConfig,
} from "@/config/AdaptiveRestConfig";
import {
  loadAdaptiveRestSettings,
  saveAdaptiveRestSettings,
} from "@/storage/adaptiveRestSettingsStorage";

type AdaptiveRestSettingsContextValue = {
  adaptiveRestConfig: AdaptiveRestConfig;
  isLoaded: boolean;

  setAdaptiveRestEnabled: (enabled: boolean) => void;
  setAdaptiveRestMode: (mode: AdaptiveRestMode) => void;
  setDefaultSetRestSeconds: (seconds: number) => void;
  setDefaultExerciseRestSeconds: (seconds: number) => void;
  setMaximumAdaptiveRestSeconds: (seconds: number) => void;
  setExerciseEffortRatingEnabled: (enabled: boolean) => void;
  restoreAdaptiveRestDefaults: () => void;
};

const AdaptiveRestSettingsContext = createContext<
  AdaptiveRestSettingsContextValue | undefined
>(undefined);

type AdaptiveRestSettingsProviderProps = {
  children: ReactNode;
};

export function AdaptiveRestSettingsProvider({
  children,
}: AdaptiveRestSettingsProviderProps) {
  const [adaptiveRestConfig, setAdaptiveRestConfig] =
    useState<AdaptiveRestConfig>(
      normalizeAdaptiveRestConfig(DEFAULT_ADAPTIVE_REST_CONFIG),
    );

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = await loadAdaptiveRestSettings();
      setAdaptiveRestConfig(saved);
      setIsLoaded(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    saveAdaptiveRestSettings(adaptiveRestConfig).catch((error) => {
      console.error("Failed to save adaptive rest settings", error);
    });
  }, [adaptiveRestConfig, isLoaded]);

  const patch = (changes: Partial<AdaptiveRestConfig>) => {
    setAdaptiveRestConfig((current) =>
      normalizeAdaptiveRestConfig({
        ...current,
        ...changes,
      }),
    );
  };

  return (
    <AdaptiveRestSettingsContext.Provider
      value={{
        adaptiveRestConfig,
        isLoaded,
        setAdaptiveRestEnabled: (enabled) => patch({ enabled }),
        setAdaptiveRestMode: (mode) => patch({ mode }),
        setDefaultSetRestSeconds: (defaultSetRestSeconds) =>
          patch({ defaultSetRestSeconds }),
        setDefaultExerciseRestSeconds: (defaultExerciseRestSeconds) =>
          patch({ defaultExerciseRestSeconds }),
        setMaximumAdaptiveRestSeconds: (maximumAdaptiveRestSeconds) =>
          patch({ maximumAdaptiveRestSeconds }),
        setExerciseEffortRatingEnabled: (exerciseEffortRatingEnabled) =>
          patch({ exerciseEffortRatingEnabled }),
        restoreAdaptiveRestDefaults: () =>
          setAdaptiveRestConfig(
            normalizeAdaptiveRestConfig(DEFAULT_ADAPTIVE_REST_CONFIG),
          ),
      }}
    >
      {children}
    </AdaptiveRestSettingsContext.Provider>
  );
}

export function useAdaptiveRestSettingsContext() {
  const context = useContext(AdaptiveRestSettingsContext);

  if (!context) {
    throw new Error(
      "useAdaptiveRestSettings must be used inside AdaptiveRestSettingsProvider",
    );
  }

  return context;
}

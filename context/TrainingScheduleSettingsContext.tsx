// context/TrainingScheduleSettingsContext.tsx

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_TRAINING_SCHEDULE_CONFIG,
  MINIMUM_PAIN_REST_DAYS,
  normalizeTrainingScheduleConfig,
  TrainingScheduleConfig,
  TrainingCyclePresetId,
} from "@/config/TrainingScheduleConfig";

import {
  loadTrainingScheduleSettings,
  saveTrainingScheduleSettings,
} from "@/storage/trainingScheduleSettingsStorage";

export const MAXIMUM_PAIN_REST_DAYS = 7;

type TrainingScheduleSettingsContextValue = {
  trainingScheduleConfig: TrainingScheduleConfig;
  isLoaded: boolean;

  setNormalRecoveryGuidanceEnabled: (enabled: boolean) => void;
  setTrainingCyclePresetId: (presetId: TrainingCyclePresetId) => void;
  setPainMinimumRestDays: (days: number) => void;
  restoreTrainingScheduleDefaults: () => void;
};

const TrainingScheduleSettingsContext = createContext<
  TrainingScheduleSettingsContextValue | undefined
>(undefined);

type TrainingScheduleSettingsProviderProps = {
  children: ReactNode;
};

export function TrainingScheduleSettingsProvider({
  children,
}: TrainingScheduleSettingsProviderProps) {
  const [trainingScheduleConfig, setTrainingScheduleConfig] =
    useState<TrainingScheduleConfig>(
      normalizeTrainingScheduleConfig(
        DEFAULT_TRAINING_SCHEDULE_CONFIG,
      ),
    );

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = await loadTrainingScheduleSettings();

      setTrainingScheduleConfig(saved);
      setIsLoaded(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveTrainingScheduleSettings(trainingScheduleConfig).catch((error) => {
      console.error("Failed to save training schedule settings", error);
    });
  }, [trainingScheduleConfig, isLoaded]);

  const setNormalRecoveryGuidanceEnabled = (enabled: boolean) => {
    setTrainingScheduleConfig((current) =>
      normalizeTrainingScheduleConfig({
        ...current,
        normalRecoveryGuidanceEnabled: enabled,

        /**
         * Normal recovery remains advisory in the current architecture.
         * Keep the internal legacy/config field true rather than exposing
         * a misleading user-facing hard-lock option.
         */
        allowNormalRecoveryOverride: true,
      }),
    );
  };

  const setTrainingCyclePresetId = (presetId: TrainingCyclePresetId) => {
    setTrainingScheduleConfig((current) =>
      normalizeTrainingScheduleConfig({
        ...current,
        trainingCyclePresetId: presetId,
      }),
    );
  };

  const setPainMinimumRestDays = (days: number) => {
    const clamped = Math.min(
      MAXIMUM_PAIN_REST_DAYS,
      Math.max(MINIMUM_PAIN_REST_DAYS, Math.round(days)),
    );

    setTrainingScheduleConfig((current) =>
      normalizeTrainingScheduleConfig({
        ...current,
        painMinimumRestDays: clamped,
      }),
    );
  };

  const restoreTrainingScheduleDefaults = () => {
    setTrainingScheduleConfig(
      normalizeTrainingScheduleConfig(
        DEFAULT_TRAINING_SCHEDULE_CONFIG,
      ),
    );
  };

  return (
    <TrainingScheduleSettingsContext.Provider
      value={{
        trainingScheduleConfig,
        isLoaded,
        setNormalRecoveryGuidanceEnabled,
        setTrainingCyclePresetId,
        setPainMinimumRestDays,
        restoreTrainingScheduleDefaults,
      }}
    >
      {children}
    </TrainingScheduleSettingsContext.Provider>
  );
}

export function useTrainingScheduleSettingsContext() {
  const context = useContext(TrainingScheduleSettingsContext);

  if (!context) {
    throw new Error(
      "useTrainingScheduleSettings must be used inside TrainingScheduleSettingsProvider",
    );
  }

  return context;
}

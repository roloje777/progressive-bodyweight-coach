import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  DEFAULT_WORKOUT_RECOVERY_CONFIG,
  normalizeWorkoutRecoveryConfig,
  WorkoutRecoveryConfig,
} from "@/config/WorkoutRecoveryConfig";
import {
  loadWorkoutRecoverySettings,
  saveWorkoutRecoverySettings,
} from "@/storage/workoutRecoverySettingsStorage";
import { clearActiveWorkout } from "@/storage/activeWorkoutStorage";

type Value = {
  workoutRecoveryConfig: WorkoutRecoveryConfig;
  isLoaded: boolean;
  setWorkoutRecoveryEnabled: (enabled: boolean) => void;
  setAutoOfferRecovery: (enabled: boolean) => void;
  setShowPerformanceGuidance: (enabled: boolean) => void;
  setWarnUnusualRecoveredResults: (enabled: boolean) => void;
  setUseRecoveredDataForProgression: (enabled: boolean) => void;
  restoreWorkoutRecoveryDefaults: () => void;
};

const Context = createContext<Value | undefined>(undefined);

export function WorkoutRecoverySettingsProvider({ children }: { children: ReactNode }) {
  const [workoutRecoveryConfig, setConfig] = useState<WorkoutRecoveryConfig>(
    DEFAULT_WORKOUT_RECOVERY_CONFIG,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadWorkoutRecoverySettings().then((saved) => {
      setConfig(saved);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveWorkoutRecoverySettings(workoutRecoveryConfig).catch((error) =>
      console.error("Failed to save workout recovery settings", error),
    );
  }, [workoutRecoveryConfig, isLoaded]);

  const patch = (changes: Partial<WorkoutRecoveryConfig>) =>
    setConfig((current) => normalizeWorkoutRecoveryConfig({ ...current, ...changes }));

  return (
    <Context.Provider
      value={{
        workoutRecoveryConfig,
        isLoaded,
        setWorkoutRecoveryEnabled: (enabled) => {
          patch({ enabled });
          if (!enabled) clearActiveWorkout().catch(() => undefined);
        },
        setAutoOfferRecovery: (autoOfferRecovery) => patch({ autoOfferRecovery }),
        setShowPerformanceGuidance: (showPerformanceGuidance) => patch({ showPerformanceGuidance }),
        setWarnUnusualRecoveredResults: (warnUnusualRecoveredResults) => patch({ warnUnusualRecoveredResults }),
        setUseRecoveredDataForProgression: (useRecoveredDataForProgression) => patch({ useRecoveredDataForProgression }),
        restoreWorkoutRecoveryDefaults: () => setConfig(DEFAULT_WORKOUT_RECOVERY_CONFIG),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useWorkoutRecoverySettingsContext() {
  const value = useContext(Context);
  if (!value) throw new Error("useWorkoutRecoverySettings must be used inside WorkoutRecoverySettingsProvider");
  return value;
}

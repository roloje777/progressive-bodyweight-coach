export type WorkoutRecoveryConfig = {
  enabled: boolean;
  autoOfferRecovery: boolean;
  showPerformanceGuidance: boolean;
  warnUnusualRecoveredResults: boolean;
  useRecoveredDataForProgression: boolean;
};

export const DEFAULT_WORKOUT_RECOVERY_CONFIG: WorkoutRecoveryConfig = {
  enabled: true,
  autoOfferRecovery: true,
  showPerformanceGuidance: true,
  warnUnusualRecoveredResults: true,
  useRecoveredDataForProgression: true,
};

export function normalizeWorkoutRecoveryConfig(
  value?: Partial<WorkoutRecoveryConfig> | null,
): WorkoutRecoveryConfig {
  return {
    ...DEFAULT_WORKOUT_RECOVERY_CONFIG,
    ...(value ?? {}),
  };
}

export interface TrainingScheduleConfig {
  /**
   * Coach can recommend recovery in normal training.
   */
  normalRecoveryGuidanceEnabled: boolean;

  /**
   * Normal-training recovery recommendations remain advisory.
   */
  allowNormalRecoveryOverride: boolean;

  /**
   * Minimum number of FULL calendar rest days required:
   * - after pain triggers before Recovery Day 1
   * - between pain-recovery sessions
   *
   * This value can be increased later in Settings, but cannot be reduced
   * below MINIMUM_PAIN_REST_DAYS.
   */
  painMinimumRestDays: number;
}

export const MINIMUM_PAIN_REST_DAYS = 2;

export const DEFAULT_TRAINING_SCHEDULE_CONFIG: TrainingScheduleConfig = {
  normalRecoveryGuidanceEnabled: true,
  allowNormalRecoveryOverride: true,
  painMinimumRestDays: MINIMUM_PAIN_REST_DAYS,
};

export function normalizeTrainingScheduleConfig(
  config: Partial<TrainingScheduleConfig> = {},
): TrainingScheduleConfig {
  return {
    ...DEFAULT_TRAINING_SCHEDULE_CONFIG,
    ...config,

    painMinimumRestDays: Math.max(
      MINIMUM_PAIN_REST_DAYS,
      config.painMinimumRestDays ??
        DEFAULT_TRAINING_SCHEDULE_CONFIG.painMinimumRestDays,
    ),
  };
}

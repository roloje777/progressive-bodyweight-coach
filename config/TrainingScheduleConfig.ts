export type TrainingCyclePresetId =
  | "recommended"
  | "balanced-recovery"
  | "extra-flexibility";

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
   * User-selected advisory training-cycle preset.
   *
   * "recommended" always uses the cycle supplied by the active program.
   * Other values resolve to a compatible 4- or 5-workout alternative.
   */
  trainingCyclePresetId: TrainingCyclePresetId;

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
  trainingCyclePresetId: "recommended",
  painMinimumRestDays: MINIMUM_PAIN_REST_DAYS,
};

const TRAINING_CYCLE_PRESET_IDS: TrainingCyclePresetId[] = [
  "recommended",
  "balanced-recovery",
  "extra-flexibility",
];

function normalizeTrainingCyclePresetId(
  value: unknown,
): TrainingCyclePresetId {
  return TRAINING_CYCLE_PRESET_IDS.includes(value as TrainingCyclePresetId)
    ? (value as TrainingCyclePresetId)
    : DEFAULT_TRAINING_SCHEDULE_CONFIG.trainingCyclePresetId;
}

export function normalizeTrainingScheduleConfig(
  config: Partial<TrainingScheduleConfig> = {},
): TrainingScheduleConfig {
  return {
    ...DEFAULT_TRAINING_SCHEDULE_CONFIG,
    ...config,

    trainingCyclePresetId: normalizeTrainingCyclePresetId(
      config.trainingCyclePresetId,
    ),

    painMinimumRestDays: Math.max(
      MINIMUM_PAIN_REST_DAYS,
      config.painMinimumRestDays ??
        DEFAULT_TRAINING_SCHEDULE_CONFIG.painMinimumRestDays,
    ),
  };
}

// config/AdaptiveVolumeConfig.ts

export interface AdaptiveVolumeConfig {
  enabled: boolean;

  /** Human-facing program week number. Default: Week 3. */
  startWeek: number;

  /**
   * Number of Rating-4/5 normal workouts required in the same program week
   * before that week is allowed to adapt.
   *
   * The Settings UI must clamp this dynamically to program.days.length.
   */
  weeklyQualifyingRatingCount: number;

  /** Internal hypertrophy/design ceiling. Not user-facing for now. */
  maxSetsPerExercise: number;

  /** Initial prescription for a newly activated optional exercise. */
  optionalExerciseSets: number;
}

export const MINIMUM_ADAPTIVE_START_WEEK = 2;
export const MAXIMUM_ADAPTIVE_START_WEEK = 4;
export const MINIMUM_WEEKLY_QUALIFYING_RATINGS = 1;

export const DEFAULT_ADAPTIVE_VOLUME_CONFIG: AdaptiveVolumeConfig = {
  enabled: true,
  startWeek: 3,
  weeklyQualifyingRatingCount: 2,
  maxSetsPerExercise: 5,
  optionalExerciseSets: 3,
};

export function normalizeAdaptiveVolumeConfig(
  config: Partial<AdaptiveVolumeConfig> | null | undefined,
): AdaptiveVolumeConfig {
  const merged = {
    ...DEFAULT_ADAPTIVE_VOLUME_CONFIG,
    ...(config ?? {}),
  };

  return {
    enabled: merged.enabled !== false,
    startWeek: Math.min(
      MAXIMUM_ADAPTIVE_START_WEEK,
      Math.max(MINIMUM_ADAPTIVE_START_WEEK, Math.round(merged.startWeek)),
    ),
    weeklyQualifyingRatingCount: Math.max(
      MINIMUM_WEEKLY_QUALIFYING_RATINGS,
      Math.round(merged.weeklyQualifyingRatingCount),
    ),
    maxSetsPerExercise: Math.max(1, Math.round(merged.maxSetsPerExercise)),
    optionalExerciseSets: Math.max(1, Math.round(merged.optionalExerciseSets)),
  };
}

export function clampAdaptiveRatingThresholdForProgram(
  configuredThreshold: number,
  programDayCount: number,
): number {
  const max = Math.max(MINIMUM_WEEKLY_QUALIFYING_RATINGS, programDayCount);

  return Math.min(
    max,
    Math.max(
      MINIMUM_WEEKLY_QUALIFYING_RATINGS,
      Math.round(configuredThreshold),
    ),
  );
}

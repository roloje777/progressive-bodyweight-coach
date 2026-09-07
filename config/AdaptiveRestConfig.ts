// config/AdaptiveRestConfig.ts

export type AdaptiveRestMode = "standard" | "personalized";

export interface AdaptiveRestConfig {
  enabled: boolean;

  /** V1 fixed heuristics or V2 personalized historical comparison. */
  mode: AdaptiveRestMode;

  /** Baseline recovery used between working sets. */
  defaultSetRestSeconds: number;

  /** Baseline recovery used after completing an exercise. */
  defaultExerciseRestSeconds: number;

  /** Hard ceiling for any adaptive recovery recommendation. */
  maximumAdaptiveRestSeconds: number;

  /** Ask for the lightweight Too Easy / About Right / Very Hard exercise rating. */
  exerciseEffortRatingEnabled: boolean;

  /** Internal recovery increment. Not user-facing for now. */
  adaptiveStepSeconds: number;
}

export const MINIMUM_REST_SECONDS = 30;
export const MAXIMUM_BASE_REST_SECONDS = 300;
export const MINIMUM_MAX_ADAPTIVE_REST_SECONDS = 60;
export const MAXIMUM_MAX_ADAPTIVE_REST_SECONDS = 360;
export const REST_STEP_SECONDS = 30;

/** Minimum comparable historical workouts before V2 is allowed to take over. */
export const MINIMUM_PERSONALIZED_HISTORY_WORKOUTS = 3;

export const DEFAULT_ADAPTIVE_REST_CONFIG: AdaptiveRestConfig = {
  enabled: true,
  mode: "personalized",
  defaultSetRestSeconds: 120,
  defaultExerciseRestSeconds: 120,
  maximumAdaptiveRestSeconds: 180,
  exerciseEffortRatingEnabled: true,
  adaptiveStepSeconds: 30,
};

function roundToRestStep(value: number): number {
  return Math.round(value / REST_STEP_SECONDS) * REST_STEP_SECONDS;
}

export function normalizeAdaptiveRestConfig(
  config: Partial<AdaptiveRestConfig> | null | undefined,
): AdaptiveRestConfig {
  const merged = {
    ...DEFAULT_ADAPTIVE_REST_CONFIG,
    ...(config ?? {}),
  };

  const defaultSetRestSeconds = Math.min(
    MAXIMUM_BASE_REST_SECONDS,
    Math.max(MINIMUM_REST_SECONDS, roundToRestStep(merged.defaultSetRestSeconds)),
  );

  const defaultExerciseRestSeconds = Math.min(
    MAXIMUM_BASE_REST_SECONDS,
    Math.max(
      MINIMUM_REST_SECONDS,
      roundToRestStep(merged.defaultExerciseRestSeconds),
    ),
  );

  const minimumAllowedMaximum = Math.max(
    MINIMUM_MAX_ADAPTIVE_REST_SECONDS,
    defaultSetRestSeconds,
    defaultExerciseRestSeconds,
  );

  const maximumAdaptiveRestSeconds = Math.min(
    MAXIMUM_MAX_ADAPTIVE_REST_SECONDS,
    Math.max(
      minimumAllowedMaximum,
      roundToRestStep(merged.maximumAdaptiveRestSeconds),
    ),
  );

  return {
    enabled: merged.enabled !== false,
    mode: merged.mode === "standard" ? "standard" : "personalized",
    defaultSetRestSeconds,
    defaultExerciseRestSeconds,
    maximumAdaptiveRestSeconds,
    exerciseEffortRatingEnabled: merged.exerciseEffortRatingEnabled !== false,
    adaptiveStepSeconds: REST_STEP_SECONDS,
  };
}

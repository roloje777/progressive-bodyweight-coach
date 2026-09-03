// engine/MatchOrBeatFeedbackEngine.ts

import { MatchOrBeatPerformance } from "@/models/WorkoutCoachingSignals";

export type AllowedFeedbackRating = 1 | 2 | 3 | 4 | 5;

export type WorkoutFeedbackAvailabilityMode =
  | "baseline"
  | "restricted"
  | "standard"
  | "strong"
  | "maximum";

export interface WorkoutFeedbackAvailabilityContext {
  mode: WorkoutFeedbackAvailabilityMode;
  allowedRatings: AllowedFeedbackRating[];
  applicableTargets: number;
  metTargets: number;
  successRate: number;
  mainCompletion: number;
  sufficientHistory: boolean;
}

export type WorkoutFeedbackAvailabilityInput = {
  /** Zero-based program week. Week 1 = 0. */
  weekIndex: number;
  performance: MatchOrBeatPerformance;
  /** Main strength-workout completion only, 0–1. */
  mainCompletion: number;
};

/**
 * Rating availability policy.
 *
 * Week 1 is unrestricted because the app is collecting baseline data.
 * From Week 2 onward the weaker of MB performance and main-workout
 * completion controls the highest subjective rating that can be selected.
 *
 * Week >= 2:
 * < 65% MB OR < 70% main completion     -> 1,2
 * >=65% MB AND >=70% main completion    -> 1,2,3
 * >=80% MB AND >=85% main completion    -> 1,2,3,4
 * 100% MB AND >=95% main completion     -> 1,2,3,4,5
 *
 * Highest tier is evaluated first.
 */
export function getWorkoutFeedbackAvailabilityContext({
  weekIndex,
  performance,
  mainCompletion,
}: WorkoutFeedbackAvailabilityInput): WorkoutFeedbackAvailabilityContext {
  const base = {
    applicableTargets: performance.applicableTargets,
    metTargets: performance.metTargets,
    successRate: performance.successRate,
    mainCompletion,
    sufficientHistory: performance.sufficientHistory,
  };

  if (weekIndex === 0) {
    return {
      ...base,
      mode: "baseline",
      allowedRatings: [1, 2, 3, 4, 5],
    };
  }

  if (performance.successRate === 1 && mainCompletion >= 0.95) {
    return {
      ...base,
      mode: "maximum",
      allowedRatings: [1, 2, 3, 4, 5],
    };
  }

  if (performance.successRate >= 0.8 && mainCompletion >= 0.85) {
    return {
      ...base,
      mode: "strong",
      allowedRatings: [1, 2, 3, 4],
    };
  }

  if (performance.successRate >= 0.65 && mainCompletion >= 0.7) {
    return {
      ...base,
      mode: "standard",
      allowedRatings: [1, 2, 3],
    };
  }

  return {
    ...base,
    mode: "restricted",
    allowedRatings: [1, 2],
  };
}

/**
 * Backward-compatible helper retained for any older callers.
 * New UI should use getWorkoutFeedbackAvailabilityContext because the
 * current policy also depends on program week and main completion.
 */
export function getMatchOrBeatFeedbackContext(
  performance: MatchOrBeatPerformance,
) {
  return getWorkoutFeedbackAvailabilityContext({
    weekIndex: 1,
    performance,
    mainCompletion: 1,
  });
}

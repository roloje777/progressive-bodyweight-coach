// engine/MatchOrBeatFeedbackEngine.ts

import { MatchOrBeatPerformance } from "@/models/WorkoutCoachingSignals";

export type MatchOrBeatFeedbackMode =
  | "restricted"
  | "balanced"
  | "positive"
  | "unavailable";

export type AllowedFeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface MatchOrBeatFeedbackContext {
  mode: MatchOrBeatFeedbackMode;

  allowedRatings: AllowedFeedbackRating[];

  applicableTargets: number;
  metTargets: number;
  successRate: number;

  sufficientHistory: boolean;
}

/**
 * Determine which subjective difficulty ratings
 * should be available after the workout.
 *
 * MB is the primary objective signal.
 *
 * < 60%  → restricted
 * 60–79% → balanced
 * ≥ 80%  → positive
 *
 * No applicable MB target → unavailable
 *
 * Insufficient historical MB data does NOT prevent
 * us from using MB to shape the feedback UI.
 * It only prevents MB from being treated as a
 * progression signal later.
 */
export function getMatchOrBeatFeedbackContext(
  performance: MatchOrBeatPerformance,
): MatchOrBeatFeedbackContext {
  const {
    applicableTargets,
    metTargets,
    successRate,
    sufficientHistory,
  } = performance;

  // -----------------------------------
  // NO MB DATA
  // -----------------------------------

  if (applicableTargets === 0) {
    return {
      mode: "unavailable",

      allowedRatings: [1, 2, 3, 4, 5],

      applicableTargets,
      metTargets,
      successRate,

      sufficientHistory,
    };
  }

  // -----------------------------------
  // RESTRICTED
  // -----------------------------------

  if (successRate < 0.6) {
    return {
      mode: "restricted",

      allowedRatings: [1, 2],

      applicableTargets,
      metTargets,
      successRate,

      sufficientHistory,
    };
  }

  // -----------------------------------
  // BALANCED
  // -----------------------------------

  if (successRate < 0.8) {
    return {
      mode: "balanced",

      allowedRatings: [2, 3, 4],

      applicableTargets,
      metTargets,
      successRate,

      sufficientHistory,
    };
  }

  // -----------------------------------
  // POSITIVE
  // -----------------------------------

  return {
    mode: "positive",

    allowedRatings: [3, 4, 5],

    applicableTargets,
    metTargets,
    successRate,

    sufficientHistory,
  };
}
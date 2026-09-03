// engine/WorkoutFeedbackEngine.ts

import {
  WorkoutCoachingSignals,
  MatchOrBeatPerformance,
  WorkoutFeedbackSignals,
  WorkoutCompletionSignals,
  CoachingHistorySignals,
} from "@/models/WorkoutCoachingSignals";

import { MatchOrBeatTarget } from "@/models/Exercise";
import { CompletedSession } from "@/models/WorkoutLog";
import { hasWorkoutFeedbackTag, WorkoutFeedbackTagId } from "@/models/WorkoutFeedback";

/**
 * -------------------------------------------------------
 * MATCH-OR-BEAT
 * -------------------------------------------------------
 *
 * Only targets with a real historical value are applicable.
 *
 * A skipped set / null target:
 * - is NOT a failed MB attempt
 * - is NOT included in the denominator
 */

export function calculateMatchOrBeatPerformance(
  targets: MatchOrBeatTarget[],
  completedSets: any[],
  validMBWeeks: number = 0,
  requiredMBWeeks: number = 4,
): MatchOrBeatPerformance {
  const applicableTargets = targets.filter(
    (target) =>
      target.target != null &&
      target.target > 0,
  );

  let metTargets = 0;

  for (const target of applicableTargets) {
    if (
      target.target == null ||
      target.target <= 0
    ) {
      continue;
    }

    const completedSet = completedSets.find(
      (set) =>
        set.setNumber === target.setNumber &&
        set.status !== "skipped",
    );

    if (!completedSet) {
      continue;
    }

    const actual = getSetValue(completedSet);

    if (
      actual != null &&
      actual >= target.target
    ) {
      metTargets++;
    }
  }

  const applicableCount =
    applicableTargets.length;

  const successRate =
    applicableCount > 0
      ? metTargets / applicableCount
      : 0;

  return {
    applicableTargets: applicableCount,
    metTargets,
    successRate,

    sufficientHistory:
      validMBWeeks >= requiredMBWeeks,

    trend: successRate,
  };
}

/**
 * Extract the actual performance value from a completed set.
 */
function getSetValue(set: any): number | null {
  if (set.status === "skipped") {
    return null;
  }

  // -----------------------------------
  // NORMAL REPS
  // -----------------------------------

  if (set.repsCompleted != null) {
    return set.repsCompleted;
  }

  // -----------------------------------
  // UNILATERAL REPS
  // -----------------------------------

  if (
    set.repsLeft != null &&
    set.repsRight != null
  ) {
    return (
      (set.repsLeft + set.repsRight) / 2
    );
  }

  // -----------------------------------
  // NORMAL HOLD
  // -----------------------------------

  if (set.durationSeconds != null) {
    return set.durationSeconds;
  }

  // -----------------------------------
  // UNILATERAL HOLD
  // -----------------------------------

  if (
    set.durationLeft != null &&
    set.durationRight != null
  ) {
    return (
      (set.durationLeft + set.durationRight) / 2
    );
  }

  return null;
}

/**
 * -------------------------------------------------------
 * FEEDBACK INTERPRETATION
 * -------------------------------------------------------
 *
 * This function translates the user's feedback into
 * structured signals.
 *
 * It does NOT make progression or deload decisions.
 */
export function interpretWorkoutFeedback(
  feedback: {
    rating: number | null;
    tags?: string[];
    comment?: string;
  },
): WorkoutFeedbackSignals {
  const tags = feedback.tags ?? [];

  return {
    difficultyRating:
      feedback.rating ?? null,

    fatigue:
      hasWorkoutFeedbackTag(tags, "low-energy"),

    pain:
      hasWorkoutFeedbackTag(tags, "joint-discomfort"),

    formBreakdown:
      hasWorkoutFeedbackTag(tags, "form-breakdown"),

    tags,

    comment: feedback.comment,
  };
}

/**
 * -------------------------------------------------------
 * COMPLETION
 * -------------------------------------------------------
 */
export function calculateWorkoutCompletion(
  workout: CompletedSession,
): WorkoutCompletionSignals {
  const warmup =
    workout.warmup;

  const stretch =
    workout.stretch;

  const warmupCompletion =
    calculateSectionCompletion(warmup);

  const stretchCompletion =
    calculateSectionCompletion(stretch);

  /**
   * Main workout completion.
   *
   * Main exercises are represented by the
   * completed session exercises.
   *
   * A skipped set does not count as completed.
   */
  const mainCompletion =
    calculateMainCompletion(workout);

  /**
   * Agreed weighting:
   *
   * warmup  = 5%
   * main    = 90%
   * stretch = 5%
   */
  const completionScore =
    warmupCompletion * 0.05 +
    mainCompletion * 0.90 +
    stretchCompletion * 0.05;

  return {
    warmupCompletion,
    mainCompletion,
    stretchCompletion,
    completionScore,
  };
}

function calculateSectionCompletion(
  section:
    | {
        completed: string[];
        skipped: string[];
        sectionSkipped: boolean;
      }
    | undefined,
): number {
  /**
   * Warm-up and stretch remain optional.
   *
   * We intentionally retain their 5% weighting.
   *
   * Skipping either section therefore reduces the
   * overall completion score, but does not make
   * progression impossible by itself.
   */
  if (!section) {
    return 0;
  }

  if (section.sectionSkipped) {
    return 0;
  }

  const completed =
    section.completed?.length ?? 0;

  const skipped =
    section.skipped?.length ?? 0;

  const total =
    completed + skipped;

  if (total === 0) {
    return 0;
  }

  return completed / total;
}

function calculateMainCompletion(
  workout: CompletedSession,
): number {
  if (!workout.exercises.length) {
    return 0;
  }

  let expectedSets = 0;
  let completedSets = 0;

  for (const exercise of workout.exercises) {
    /**
     * At this stage we only know about the sets
     * represented in the CompletedSession.
     *
     * The future 85% planned-workout rule should
     * NOT be implemented here until the planned
     * set count is available.
     */
    const sets = exercise.sets ?? [];

    expectedSets += sets.length;

    completedSets += sets.filter(
      (set) => set.status === "completed",
    ).length;
  }

  if (expectedSets === 0) {
    return 0;
  }

  return completedSets / expectedSets;
}


/**
 * -------------------------------------------------------
 * HISTORY
 * -------------------------------------------------------
 *
 * This function produces historical signals only.
 *
 * It does NOT determine whether the user should
 * progress, hold or deload.
 *
 * We track two different forms of history:
 *
 * 1. Total historical occurrences
 *    --------------------------------
 *    How many previous workouts contained the signal.
 *
 *    Used for longer-term coaching context.
 *
 * 2. Recent consecutive occurrences
 *    --------------------------------
 *    How many consecutive previous workouts contained
 *    the signal, starting from the most recent workout.
 *
 *    Used for immediate recurrence rules.
 *
 * Example:
 *
 * oldest → newest
 *
 * fatigue:
 * no → yes → yes
 *
 * recentFatigueOccurrences = 2
 *
 * This means fatigue has occurred in the last two
 * consecutive workouts.
 */
export function buildCoachingHistorySignals(
  workoutHistory: CompletedSession[],
  currentWorkout: CompletedSession,
  validMBWeeks: number,
  requiredMBWeeks: number = 4,
): CoachingHistorySignals {
  /**
   * Exclude the current workout.
   *
   * The current workout is already represented by
   * WorkoutFeedbackSignals and should not be counted
   * as a historical occurrence.
   */
  const previousWorkouts =
    workoutHistory.filter(
      (workout) =>
        workout !== currentWorkout,
    );

  /**
   * ---------------------------------------------------
   * TOTAL HISTORICAL OCCURRENCES
   * ---------------------------------------------------
   *
   * These values represent the complete historical
   * record available to the engine.
   */

  const fatigueOccurrences =
    countTagOccurrences(
      previousWorkouts,
      "low-energy",
    );

  const painOccurrences =
    countTagOccurrences(
      previousWorkouts,
      "joint-discomfort",
    );

  const formBreakdownOccurrences =
    countTagOccurrences(
      previousWorkouts,
      "form-breakdown",
    );

  /**
   * ---------------------------------------------------
   * RECENT CONSECUTIVE OCCURRENCES
   * ---------------------------------------------------
   *
   * These values represent the current recurring
   * pattern.
   *
   * They are intentionally separate from the total
   * historical counts.
   */

  const recentFatigueOccurrences =
    countRecentConsecutiveTagOccurrences(
      previousWorkouts,
      "low-energy",
    );

  const recentPainOccurrences =
    countRecentConsecutiveTagOccurrences(
      previousWorkouts,
      "joint-discomfort",
    );

  const recentFormBreakdownOccurrences =
    countRecentConsecutiveTagOccurrences(
      previousWorkouts,
      "form-breakdown",
    );

  return {
    /**
     * Total historical occurrences
     */
    fatigueOccurrences,
    painOccurrences,
    formBreakdownOccurrences,

    /**
     * Recent consecutive occurrences
     */
    recentFatigueOccurrences,
    recentPainOccurrences,
    recentFormBreakdownOccurrences,

    /**
     * MB history configuration
     *
     * IMPORTANT:
     *
     * requiredMBWeeks is NOT hard-coded to 4 by the
     * coaching system.
     *
     * The caller supplies the program/workout's
     * configured weeks value.
     */
    validMBWeeks,
    requiredMBWeeks,
  };
}

/**
 * -------------------------------------------------------
 * TOTAL TAG OCCURRENCES
 * -------------------------------------------------------
 *
 * Counts every historical workout containing the
 * specified feedback tag.
 *
 * Example:
 *
 * no → yes → no → yes → yes
 *
 * result = 3
 */
function countTagOccurrences(
  workouts: CompletedSession[],
  tag: WorkoutFeedbackTagId,
): number {
  return workouts.reduce(
    (count, workout) => {
      const tags =
        workout.feedback?.tags ?? [];

      return hasWorkoutFeedbackTag(tags, tag)
        ? count + 1
        : count;
    },
    0,
  );
}

/**
 * -------------------------------------------------------
 * RECENT CONSECUTIVE TAG OCCURRENCES
 * -------------------------------------------------------
 *
 * Counts the number of consecutive historical workouts
 * containing the specified tag, starting with the most
 * recent historical workout.
 *
 * Example 1:
 *
 * oldest → newest
 *
 * no → yes → yes → yes
 *
 * result = 3
 *
 *
 * Example 2:
 *
 * oldest → newest
 *
 * yes → yes → no → yes
 *
 * result = 1
 *
 * The search starts at the most recent workout and
 * stops immediately when the signal is absent.
 *
 * This is what allows ProgramReadinessEngine to apply
 * rules such as:
 *
 * recent fatigue >= 2
 *     → progression blocked
 *
 * recent fatigue >= 3
 *     → deload candidate
 *
 * without losing the total historical occurrence count.
 */
function countRecentConsecutiveTagOccurrences(
  workouts: CompletedSession[],
  tag: WorkoutFeedbackTagId,
): number {
  let count = 0;

  for (
    let i = workouts.length - 1;
    i >= 0;
    i--
  ) {
    const tags =
      workouts[i].feedback?.tags ?? [];

    if (!hasWorkoutFeedbackTag(tags, tag)) {
      break;
    }

    count++;
  }

  return count;
}

/**
 * -------------------------------------------------------
 * FINAL COACHING SIGNALS
 * -------------------------------------------------------
 *
 * Combines:
 *
 * feedback
 * + MB performance
 * + completion
 * + historical context
 *
 * into a single coaching-signal contract.
 *
 * IMPORTANT:
 *
 * This function intentionally does NOT decide:
 *
 * - readiness
 * - progression
 * - hold
 * - deload
 *
 * Those decisions belong to ProgramReadinessEngine.
 */
export function buildWorkoutCoachingSignals(
  feedback: {
    rating: number | null;
    tags?: string[];
    comment?: string;
  },
  workout: CompletedSession,
  matchOrBeatTargets: MatchOrBeatTarget[],
  workoutHistory: CompletedSession[] = [],
  validMBWeeks: number = 0,
  requiredMBWeeks: number = 4,
  completedSets?: any[],
): WorkoutCoachingSignals {
  const feedbackSignals =
    interpretWorkoutFeedback(feedback);

  const completion =
    calculateWorkoutCompletion(workout);

  const matchOrBeat =
    calculateMatchOrBeatPerformance(
      matchOrBeatTargets,
      completedSets ??
        workout.exercises.flatMap(
          (exercise) => exercise.sets,
        ),
      validMBWeeks,
      requiredMBWeeks,
    );

  const history =
    buildCoachingHistorySignals(
      workoutHistory,
      workout,
      validMBWeeks,
      requiredMBWeeks,
    );

   

   return {
    feedback: feedbackSignals,
    matchOrBeat,
    completion,
    history,
   
  };
}
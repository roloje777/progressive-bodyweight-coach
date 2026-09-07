// engine/AdaptiveRestEngine.ts

import {
  AdaptiveRestConfig,
  MINIMUM_PERSONALIZED_HISTORY_WORKOUTS,
} from "@/config/AdaptiveRestConfig";
import {
  CompletedSession,
  CompletedSet,
  ExerciseEffortRating,
} from "@/models/WorkoutLog";
import { MatchOrBeatTarget } from "@/models/Exercise";

export type AdaptiveRestReason =
  | "adaptive-disabled"
  | "baseline"
  | "moderate-performance-drop"
  | "large-performance-drop"
  | "very-hard-exercise"
  | "personalized-fallback-standard"
  | "personalized-normal"
  | "personalized-moderate-deviation"
  | "personalized-large-deviation"
  | "personalized-hard-exercise";

export type AdaptiveRestModeUsed =
  | "disabled"
  | "standard"
  | "standard-fallback"
  | "personalized";

export type MatchOrBeatOutcome = "passed" | "failed" | null;

export type AdaptiveRestDecision = {
  baseRestSeconds: number;
  recommendedRestSeconds: number;
  adaptiveAdjustmentSeconds: number;
  performanceDropOffPercent: number | null;
  reason: AdaptiveRestReason;

  /** Which engine actually produced the decision. */
  modeUsed: AdaptiveRestModeUsed;

  /** V2 diagnostics retained for testing/debugging. */
  personalizedHistoryCount: number;
  historicalTypicalDropOffPercent: number | null;
  historicalTypicalRestSeconds: number | null;
  deviationFromTypicalDropOffPercent: number | null;
  matchOrBeatOutcome: MatchOrBeatOutcome;
};

/**
 * V1 thresholds are coaching heuristics, not biological hypertrophy cut-offs.
 */
export const MODERATE_DROP_OFF_PERCENT = 20;
export const LARGE_DROP_OFF_PERCENT = 30;

/**
 * V2 compares the current drop against the athlete's own recent normal.
 * These are intentionally conservative coaching heuristics.
 */
export const PERSONALIZED_MODERATE_DEVIATION_PERCENT = 8;
export const PERSONALIZED_LARGE_DEVIATION_PERCENT = 15;
export const MAX_PERSONALIZED_HISTORY_WORKOUTS = 6;

function getComparableSetPerformance(set: Partial<CompletedSet>): number | null {
  if (set.status === "skipped") return null;

  if (set.repsCompleted != null) return set.repsCompleted;

  if (set.reps != null) {
    if (typeof set.reps === "number") return set.reps;
    return (set.reps.left + set.reps.right) / 2;
  }

  if (set.repsLeft != null && set.repsRight != null) {
    return (set.repsLeft + set.repsRight) / 2;
  }

  if (set.durationSeconds != null) return set.durationSeconds;

  if (set.durationLeft != null && set.durationRight != null) {
    return (set.durationLeft + set.durationRight) / 2;
  }

  return null;
}

export function calculateSetPerformanceDropOffPercent(
  previousSet: Partial<CompletedSet> | null | undefined,
  currentSet: Partial<CompletedSet> | null | undefined,
): number | null {
  if (!previousSet || !currentSet) return null;

  const previous = getComparableSetPerformance(previousSet);
  const current = getComparableSetPerformance(currentSet);

  if (previous == null || current == null || previous <= 0) return null;

  return Math.max(0, ((previous - current) / previous) * 100);
}

function clampRest(
  baseRestSeconds: number,
  adjustmentSeconds: number,
  maximumAdaptiveRestSeconds: number,
): number {
  const effectiveMaximum = Math.max(
    baseRestSeconds,
    maximumAdaptiveRestSeconds,
  );

  return Math.min(
    effectiveMaximum,
    Math.max(baseRestSeconds, baseRestSeconds + adjustmentSeconds),
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) return sorted[middle];

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function isComparableHistoricalWorkout(
  workout: CompletedSession,
  programId?: string,
): boolean {
  if (programId && workout.programId !== programId) return false;

  // Deload and verification exposures intentionally use different recovery
  // prescriptions and are not treated as a normal personalized baseline.
  if (
    workout.trainingMode === "verification" ||
    workout.trainingMode?.startsWith("deload-")
  ) {
    return false;
  }

  const feedback = workout.feedback;

  if (feedback?.rating != null && feedback.rating <= 2) return false;

  const tags = feedback?.tags ?? [];

  if (
    tags.includes("joint-discomfort") ||
    tags.includes("form-breakdown") ||
    tags.includes("low-energy")
  ) {
    return false;
  }

  return true;
}

type HistoricalTransition = {
  dropOffPercent: number;
  restBeforeCurrentSetSeconds: number | null;
};

function getHistoricalTransitions(args: {
  workoutHistory: CompletedSession[];
  programId?: string;
  exerciseId: string;
  currentSetNumber: number;
}): HistoricalTransition[] {
  const { workoutHistory, programId, exerciseId, currentSetNumber } = args;

  if (currentSetNumber <= 1) return [];

  const transitions: HistoricalTransition[] = [];

  for (let index = workoutHistory.length - 1; index >= 0; index--) {
    const workout = workoutHistory[index];

    if (!isComparableHistoricalWorkout(workout, programId)) continue;

    const exercise = workout.exercises.find(
      (candidate) => candidate.exerciseId === exerciseId,
    );

    if (!exercise) continue;

    const previousSet = exercise.sets.find(
      (set) => set.setNumber === currentSetNumber - 1,
    );
    const currentSet = exercise.sets.find(
      (set) => set.setNumber === currentSetNumber,
    );

    const dropOffPercent = calculateSetPerformanceDropOffPercent(
      previousSet,
      currentSet,
    );

    if (dropOffPercent == null) continue;

    transitions.push({
      dropOffPercent,
      restBeforeCurrentSetSeconds:
        currentSet?.actualRestBeforeSet ??
        currentSet?.prescribedRestBeforeSet ??
        null,
    });

    if (transitions.length >= MAX_PERSONALIZED_HISTORY_WORKOUTS) break;
  }

  return transitions;
}

function getMatchOrBeatOutcome(
  currentSet: Partial<CompletedSet> | null | undefined,
  matchOrBeatTarget: number | null | undefined,
): MatchOrBeatOutcome {
  if (matchOrBeatTarget == null || matchOrBeatTarget <= 0 || !currentSet) {
    return null;
  }

  const performance = getComparableSetPerformance(currentSet);
  if (performance == null) return null;

  return performance >= matchOrBeatTarget ? "passed" : "failed";
}

function buildDecision(args: {
  baseRestSeconds: number;
  recommendedRestSeconds: number;
  performanceDropOffPercent: number | null;
  reason: AdaptiveRestReason;
  modeUsed: AdaptiveRestModeUsed;
  personalizedHistoryCount?: number;
  historicalTypicalDropOffPercent?: number | null;
  historicalTypicalRestSeconds?: number | null;
  deviationFromTypicalDropOffPercent?: number | null;
  matchOrBeatOutcome?: MatchOrBeatOutcome;
}): AdaptiveRestDecision {
  return {
    baseRestSeconds: args.baseRestSeconds,
    recommendedRestSeconds: args.recommendedRestSeconds,
    adaptiveAdjustmentSeconds:
      args.recommendedRestSeconds - args.baseRestSeconds,
    performanceDropOffPercent: args.performanceDropOffPercent,
    reason: args.reason,
    modeUsed: args.modeUsed,
    personalizedHistoryCount: args.personalizedHistoryCount ?? 0,
    historicalTypicalDropOffPercent:
      args.historicalTypicalDropOffPercent ?? null,
    historicalTypicalRestSeconds: args.historicalTypicalRestSeconds ?? null,
    deviationFromTypicalDropOffPercent:
      args.deviationFromTypicalDropOffPercent ?? null,
    matchOrBeatOutcome: args.matchOrBeatOutcome ?? null,
  };
}

function getStandardSetRestDecision(args: {
  config: AdaptiveRestConfig;
  baseRestSeconds: number;
  previousSet?: Partial<CompletedSet> | null;
  currentSet?: Partial<CompletedSet> | null;
  matchOrBeatTarget?: number | null;
  reasonOverride?: AdaptiveRestReason;
  modeUsed?: AdaptiveRestModeUsed;
}): AdaptiveRestDecision {
  const {
    config,
    baseRestSeconds,
    previousSet,
    currentSet,
    matchOrBeatTarget,
  } = args;

  const dropOff = calculateSetPerformanceDropOffPercent(previousSet, currentSet);

  let adjustmentSeconds = 0;
  let reason: AdaptiveRestReason = "baseline";

  if (dropOff != null && dropOff > LARGE_DROP_OFF_PERCENT) {
    adjustmentSeconds = config.adaptiveStepSeconds * 2;
    reason = "large-performance-drop";
  } else if (dropOff != null && dropOff > MODERATE_DROP_OFF_PERCENT) {
    adjustmentSeconds = config.adaptiveStepSeconds;
    reason = "moderate-performance-drop";
  }

  const recommendedRestSeconds = clampRest(
    baseRestSeconds,
    adjustmentSeconds,
    config.maximumAdaptiveRestSeconds,
  );

  return buildDecision({
    baseRestSeconds,
    recommendedRestSeconds,
    performanceDropOffPercent: dropOff,
    reason: args.reasonOverride ?? reason,
    modeUsed: args.modeUsed ?? "standard",
    matchOrBeatOutcome: getMatchOrBeatOutcome(currentSet, matchOrBeatTarget),
  });
}

export function getAdaptiveSetRestDecision(args: {
  config: AdaptiveRestConfig;
  baseRestSeconds: number;
  previousSet?: Partial<CompletedSet> | null;
  currentSet?: Partial<CompletedSet> | null;

  /** V2 context. V1 ignores these values. */
  workoutHistory?: CompletedSession[];
  programId?: string;
  exerciseId?: string;
  currentSetNumber?: number;
  matchOrBeatTarget?: number | null;
  currentRestBeforeSetSeconds?: number | null;
}): AdaptiveRestDecision {
  const {
    config,
    baseRestSeconds,
    previousSet,
    currentSet,
    workoutHistory = [],
    programId,
    exerciseId,
    currentSetNumber,
    matchOrBeatTarget,
    currentRestBeforeSetSeconds,
  } = args;

  if (!config.enabled) {
    return buildDecision({
      baseRestSeconds,
      recommendedRestSeconds: baseRestSeconds,
      performanceDropOffPercent: null,
      reason: "adaptive-disabled",
      modeUsed: "disabled",
    });
  }

  if (config.mode === "standard") {
    return getStandardSetRestDecision({
      config,
      baseRestSeconds,
      previousSet,
      currentSet,
      matchOrBeatTarget,
    });
  }

  const resolvedSetNumber =
    currentSetNumber ?? currentSet?.setNumber ?? undefined;

  if (!exerciseId || !resolvedSetNumber || resolvedSetNumber <= 1) {
    return getStandardSetRestDecision({
      config,
      baseRestSeconds,
      previousSet,
      currentSet,
      matchOrBeatTarget,
      reasonOverride: "personalized-fallback-standard",
      modeUsed: "standard-fallback",
    });
  }

  const historicalTransitions = getHistoricalTransitions({
    workoutHistory,
    programId,
    exerciseId,
    currentSetNumber: resolvedSetNumber,
  });

  if (
    historicalTransitions.length < MINIMUM_PERSONALIZED_HISTORY_WORKOUTS
  ) {
    const fallback = getStandardSetRestDecision({
      config,
      baseRestSeconds,
      previousSet,
      currentSet,
      matchOrBeatTarget,
      reasonOverride: "personalized-fallback-standard",
      modeUsed: "standard-fallback",
    });

    return {
      ...fallback,
      personalizedHistoryCount: historicalTransitions.length,
    };
  }

  const dropOff = calculateSetPerformanceDropOffPercent(previousSet, currentSet);
  const typicalDrop = median(
    historicalTransitions.map((transition) => transition.dropOffPercent),
  );
  const typicalRest = median(
    historicalTransitions
      .map((transition) => transition.restBeforeCurrentSetSeconds)
      .filter((value): value is number => value != null),
  );
  const matchOrBeatOutcome = getMatchOrBeatOutcome(
    currentSet,
    matchOrBeatTarget,
  );

  if (dropOff == null || typicalDrop == null) {
    return buildDecision({
      baseRestSeconds,
      recommendedRestSeconds: baseRestSeconds,
      performanceDropOffPercent: dropOff,
      reason: "personalized-normal",
      modeUsed: "personalized",
      personalizedHistoryCount: historicalTransitions.length,
      historicalTypicalDropOffPercent: typicalDrop,
      historicalTypicalRestSeconds: typicalRest,
      matchOrBeatOutcome,
    });
  }

  const deviation = Math.max(0, dropOff - typicalDrop);

  let severity = 0;

  if (deviation >= PERSONALIZED_LARGE_DEVIATION_PERCENT) {
    severity = 2;
  } else if (deviation >= PERSONALIZED_MODERATE_DEVIATION_PERCENT) {
    severity = 1;
  }

  // A Match-or-Beat failure strengthens a meaningful personalized deviation,
  // but never creates an adaptive increase by itself.
  if (
    matchOrBeatOutcome === "failed" &&
    deviation >= PERSONALIZED_MODERATE_DEVIATION_PERCENT - 3
  ) {
    severity = Math.max(severity, 1);

    if (deviation >= PERSONALIZED_LARGE_DEVIATION_PERCENT - 5) {
      severity = 2;
    }
  }

  // Actual recovery context is a supporting signal. If the athlete received
  // less recovery than their recent personal norm and performance also fell
  // unusually hard, escalate one level. Equal/longer rest does not penalize.
  if (
    typicalRest != null &&
    currentRestBeforeSetSeconds != null &&
    currentRestBeforeSetSeconds + config.adaptiveStepSeconds <= typicalRest &&
    deviation >= PERSONALIZED_MODERATE_DEVIATION_PERCENT
  ) {
    severity = Math.min(2, severity + 1);
  }

  const adjustmentSeconds = severity * config.adaptiveStepSeconds;
  const recommendedRestSeconds = clampRest(
    baseRestSeconds,
    adjustmentSeconds,
    config.maximumAdaptiveRestSeconds,
  );

  return buildDecision({
    baseRestSeconds,
    recommendedRestSeconds,
    performanceDropOffPercent: dropOff,
    reason:
      severity >= 2
        ? "personalized-large-deviation"
        : severity === 1
          ? "personalized-moderate-deviation"
          : "personalized-normal",
    modeUsed: "personalized",
    personalizedHistoryCount: historicalTransitions.length,
    historicalTypicalDropOffPercent: typicalDrop,
    historicalTypicalRestSeconds: typicalRest,
    deviationFromTypicalDropOffPercent: deviation,
    matchOrBeatOutcome,
  });
}

function getStandardExerciseRestDecision(args: {
  config: AdaptiveRestConfig;
  baseRestSeconds: number;
  exerciseEffortRating?: ExerciseEffortRating | null;
  reasonOverride?: AdaptiveRestReason;
  modeUsed?: AdaptiveRestModeUsed;
}): AdaptiveRestDecision {
  const { config, baseRestSeconds, exerciseEffortRating } = args;

  const adjustmentSeconds =
    exerciseEffortRating === 3 ? config.adaptiveStepSeconds : 0;

  const recommendedRestSeconds = clampRest(
    baseRestSeconds,
    adjustmentSeconds,
    config.maximumAdaptiveRestSeconds,
  );

  return buildDecision({
    baseRestSeconds,
    recommendedRestSeconds,
    performanceDropOffPercent: null,
    reason:
      args.reasonOverride ??
      (exerciseEffortRating === 3 ? "very-hard-exercise" : "baseline"),
    modeUsed: args.modeUsed ?? "standard",
  });
}

export function getAdaptiveExerciseRestDecision(args: {
  config: AdaptiveRestConfig;
  baseRestSeconds: number;
  exerciseEffortRating?: ExerciseEffortRating | null;

  /** V2 context for the exercise that has just finished. */
  workoutHistory?: CompletedSession[];
  programId?: string;
  exerciseId?: string;
  completedSets?: Partial<CompletedSet>[];
  matchOrBeatTargets?: MatchOrBeatTarget[];
}): AdaptiveRestDecision {
  const {
    config,
    baseRestSeconds,
    exerciseEffortRating,
    workoutHistory = [],
    programId,
    exerciseId,
    completedSets = [],
    matchOrBeatTargets = [],
  } = args;

  if (!config.enabled) {
    return buildDecision({
      baseRestSeconds,
      recommendedRestSeconds: baseRestSeconds,
      performanceDropOffPercent: null,
      reason: "adaptive-disabled",
      modeUsed: "disabled",
    });
  }

  if (config.mode === "standard") {
    return getStandardExerciseRestDecision({
      config,
      baseRestSeconds,
      exerciseEffortRating,
    });
  }

  if (!exerciseId || completedSets.length < 2) {
    return getStandardExerciseRestDecision({
      config,
      baseRestSeconds,
      exerciseEffortRating,
      reasonOverride: "personalized-fallback-standard",
      modeUsed: "standard-fallback",
    });
  }

  const personalizedComparisons = completedSets
    .slice(1)
    .map((currentSet, index) => {
      const previousSet = completedSets[index];
      const setNumber = currentSet.setNumber ?? index + 2;
      const history = getHistoricalTransitions({
        workoutHistory,
        programId,
        exerciseId,
        currentSetNumber: setNumber,
      });

      if (history.length < MINIMUM_PERSONALIZED_HISTORY_WORKOUTS) return null;

      const currentDrop = calculateSetPerformanceDropOffPercent(
        previousSet,
        currentSet,
      );
      const typicalDrop = median(history.map((item) => item.dropOffPercent));
      const typicalRest = median(
        history
          .map((item) => item.restBeforeCurrentSetSeconds)
          .filter((value): value is number => value != null),
      );

      if (currentDrop == null || typicalDrop == null) return null;

      const target = matchOrBeatTargets.find(
        (candidate) => candidate.setNumber === setNumber,
      )?.target;
      const currentRest =
        currentSet.actualRestBeforeSet ??
        currentSet.prescribedRestBeforeSet ??
        null;

      return {
        currentDrop,
        typicalDrop,
        typicalRest,
        currentRest,
        deviation: Math.max(0, currentDrop - typicalDrop),
        matchOrBeatOutcome: getMatchOrBeatOutcome(currentSet, target),
        historyCount: history.length,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value != null);

  if (personalizedComparisons.length === 0) {
    return getStandardExerciseRestDecision({
      config,
      baseRestSeconds,
      exerciseEffortRating,
      reasonOverride: "personalized-fallback-standard",
      modeUsed: "standard-fallback",
    });
  }

  const maxDeviation = Math.max(
    ...personalizedComparisons.map((comparison) => comparison.deviation),
  );
  const maxCurrentDrop = Math.max(
    ...personalizedComparisons.map((comparison) => comparison.currentDrop),
  );
  const typicalDrop = median(
    personalizedComparisons.map((comparison) => comparison.typicalDrop),
  );
  const historyCount = Math.min(
    ...personalizedComparisons.map((comparison) => comparison.historyCount),
  );
  const historicalTypicalRestSeconds = median(
    personalizedComparisons
      .map((comparison) => comparison.typicalRest)
      .filter((value): value is number => value != null),
  );
  const hasMbFailure = personalizedComparisons.some(
    (comparison) => comparison.matchOrBeatOutcome === "failed",
  );
  const hadShorterThanTypicalRest = personalizedComparisons.some(
    (comparison) =>
      comparison.typicalRest != null &&
      comparison.currentRest != null &&
      comparison.currentRest + config.adaptiveStepSeconds <=
        comparison.typicalRest &&
      comparison.deviation >= PERSONALIZED_MODERATE_DEVIATION_PERCENT,
  );

  let severity = 0;

  if (maxDeviation >= PERSONALIZED_LARGE_DEVIATION_PERCENT) {
    severity = 2;
  } else if (maxDeviation >= PERSONALIZED_MODERATE_DEVIATION_PERCENT) {
    severity = 1;
  }

  if (hasMbFailure && maxDeviation >= PERSONALIZED_MODERATE_DEVIATION_PERCENT - 3) {
    severity = Math.max(severity, 1);
  }

  if (hadShorterThanTypicalRest) {
    severity = Math.min(2, Math.max(1, severity + 1));
  }

  // The current exercise rating becomes available here, so V2 can combine it
  // with objective performance rather than using it in isolation.
  if (exerciseEffortRating === 3) {
    severity = Math.max(severity, 1);

    if (
      hasMbFailure ||
      maxDeviation >= PERSONALIZED_MODERATE_DEVIATION_PERCENT
    ) {
      severity = Math.min(2, severity + 1);
    }
  }

  const adjustmentSeconds = severity * config.adaptiveStepSeconds;
  const recommendedRestSeconds = clampRest(
    baseRestSeconds,
    adjustmentSeconds,
    config.maximumAdaptiveRestSeconds,
  );

  return buildDecision({
    baseRestSeconds,
    recommendedRestSeconds,
    performanceDropOffPercent: maxCurrentDrop,
    reason:
      severity >= 2
        ? "personalized-hard-exercise"
        : severity === 1
          ? "personalized-moderate-deviation"
          : "personalized-normal",
    modeUsed: "personalized",
    personalizedHistoryCount: historyCount,
    historicalTypicalDropOffPercent: typicalDrop,
    historicalTypicalRestSeconds,
    deviationFromTypicalDropOffPercent: maxDeviation,
    matchOrBeatOutcome: hasMbFailure ? "failed" : "passed",
  });
}

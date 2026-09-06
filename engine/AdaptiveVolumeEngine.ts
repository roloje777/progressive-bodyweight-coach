// engine/AdaptiveVolumeEngine.ts

import {
  AdaptiveProgramState,
  AdaptiveQualifyingWorkout,
  AdaptiveRecommendationItem,
  AdaptiveWeeklyState,
  AdaptiveWorkoutSetCandidate,
  EMPTY_ADAPTIVE_PROGRAM_STATE,
  PendingAdaptiveRecommendation,
  getAdaptiveExerciseKey,
  getAdaptiveWeekKey,
} from "@/models/AdaptiveVolume";
import {
  AdaptiveVolumeConfig,
  clampAdaptiveRatingThresholdForProgram,
} from "@/config/AdaptiveVolumeConfig";
import { MatchOrBeatTarget } from "@/models/Exercise";

export type AdaptiveCompletedSetLike = {
  setNumber: number;
  status?: string;
  repsCompleted?: number;
  repsLeft?: number;
  repsRight?: number;
  durationSeconds?: number;
  durationLeft?: number;
  durationRight?: number;
};

export type AdaptiveExerciseEvidence = {
  exerciseId: string;
  currentSets: number;
  programOrder: number;
  applicableTargets: number;
  metTargets: number;
  beatenTargets: number;
  overperformanceScore: number;
};

export type BuildAdaptiveWorkoutCandidateInput = {
  programId: string;
  weekIndex: number;
  dayId: string;
  dayIndex: number;
  exercises: AdaptiveExerciseEvidence[];
  maxSetsPerExercise: number;
};

export type RecordAdaptiveWorkoutInput = {
  state: AdaptiveProgramState | null | undefined;
  config: AdaptiveVolumeConfig;
  programId: string;
  programDayCount: number;
  weekIndex: number;
  dayId: string;
  dayIndex: number;
  workoutKey: string;
  rating: number;
  trainingMode?: string;
  setCandidate?: AdaptiveWorkoutSetCandidate;
  rating5OptionalExerciseId?: string;
};

export type RecordAdaptiveWorkoutResult = {
  state: AdaptiveProgramState;
  weekQualified: boolean;
  newlyQualified: boolean;
  newItemCount: number;
  shouldPresentCoach: boolean;
};

function cloneState(
  state: AdaptiveProgramState | null | undefined,
): AdaptiveProgramState {
  if (!state) {
    return {
      setOverrides: {},
      activatedOptionalExercises: {},
      weekly: {},
      pendingRecommendations: {},
    };
  }

  return {
    setOverrides: { ...state.setOverrides },
    activatedOptionalExercises: { ...state.activatedOptionalExercises },
    weekly: { ...state.weekly },
    pendingRecommendations: { ...(state.pendingRecommendations ?? {}) },
  };
}

function getSetValue(set: AdaptiveCompletedSetLike): number | null {
  if (set.status === "skipped") return null;
  if (set.repsCompleted != null) return set.repsCompleted;
  if (set.repsLeft != null && set.repsRight != null) {
    return (set.repsLeft + set.repsRight) / 2;
  }
  if (set.durationSeconds != null) return set.durationSeconds;
  if (set.durationLeft != null && set.durationRight != null) {
    return (set.durationLeft + set.durationRight) / 2;
  }
  return null;
}

export function calculateAdaptiveExerciseEvidence(input: {
  exerciseId: string;
  currentSets: number;
  programOrder: number;
  targets: MatchOrBeatTarget[];
  completedSets: AdaptiveCompletedSetLike[];
}): AdaptiveExerciseEvidence {
  const applicable = input.targets.filter(
    (target) => target.target != null && target.target > 0,
  );

  let metTargets = 0;
  let beatenTargets = 0;
  let ratioTotal = 0;
  let ratioCount = 0;

  for (const target of applicable) {
    const completedSet = input.completedSets.find(
      (set) => set.setNumber === target.setNumber && set.status !== "skipped",
    );
    if (!completedSet || target.target == null || target.target <= 0) continue;

    const actual = getSetValue(completedSet);
    if (actual == null) continue;

    ratioTotal += actual / target.target;
    ratioCount++;
    if (actual >= target.target) metTargets++;
    if (actual > target.target) beatenTargets++;
  }

  return {
    exerciseId: input.exerciseId,
    currentSets: input.currentSets,
    programOrder: input.programOrder,
    applicableTargets: applicable.length,
    metTargets,
    beatenTargets,
    overperformanceScore: ratioCount > 0 ? ratioTotal / ratioCount : 0,
  };
}

export function didExerciseBeatMatchOrBeat(
  evidence: AdaptiveExerciseEvidence,
): boolean {
  return (
    evidence.applicableTargets > 0 &&
    evidence.metTargets === evidence.applicableTargets &&
    evidence.beatenTargets > 0
  );
}

export function selectAdaptiveSetCandidate(
  input: BuildAdaptiveWorkoutCandidateInput,
): AdaptiveWorkoutSetCandidate | undefined {
  const eligible = input.exercises
    .filter(
      (exercise) =>
        didExerciseBeatMatchOrBeat(exercise) &&
        exercise.currentSets < input.maxSetsPerExercise,
    )
    .sort((a, b) => {
      if (a.currentSets !== b.currentSets) return a.currentSets - b.currentSets;
      if (a.overperformanceScore !== b.overperformanceScore) {
        return b.overperformanceScore - a.overperformanceScore;
      }
      return a.programOrder - b.programOrder;
    });

  const selected = eligible[0];
  if (!selected) return undefined;

  return {
    programId: input.programId,
    weekIndex: input.weekIndex,
    dayId: input.dayId,
    dayIndex: input.dayIndex,
    exerciseId: selected.exerciseId,
    fromSets: selected.currentSets,
    toSets: Math.min(selected.currentSets + 1, input.maxSetsPerExercise),
    overperformanceScore: selected.overperformanceScore,
  };
}

export function isAdaptiveWeekEligible(
  weekIndex: number,
  config: AdaptiveVolumeConfig,
): boolean {
  return config.enabled && weekIndex >= config.startWeek - 1;
}

export function isAdaptiveTrainingModeEligible(trainingMode?: string): boolean {
  return trainingMode == null || trainingMode === "normal";
}

export function isQualifyingAdaptiveRating(
  rating: number | null | undefined,
): rating is 4 | 5 {
  return rating === 4 || rating === 5;
}

function createEmptyWeek(programId: string, weekIndex: number): AdaptiveWeeklyState {
  return {
    programId,
    weekIndex,
    qualifyingWorkouts: [],
    qualified: false,
    queuedSetWorkoutKeys: [],
    queuedOptionalWorkoutKeys: [],
  };
}

function createEmptyRecommendation(
  programId: string,
  weekIndex: number,
): PendingAdaptiveRecommendation {
  return {
    programId,
    weekIndex,
    items: [],
    lastPresentedItemCount: 0,
    closed: false,
  };
}

function setOfferId(candidate: AdaptiveWorkoutSetCandidate): string {
  return `set:${candidate.programId}:${candidate.weekIndex}:${candidate.dayId}:${candidate.exerciseId}:${candidate.fromSets}->${candidate.toSets}`;
}

function optionalOfferId(
  programId: string,
  weekIndex: number,
  dayId: string,
  exerciseId: string,
): string {
  return `optional:${programId}:${weekIndex}:${dayId}:${exerciseId}`;
}

export function recordAdaptiveWorkout(
  input: RecordAdaptiveWorkoutInput,
): RecordAdaptiveWorkoutResult {
  const state = cloneState(input.state ?? EMPTY_ADAPTIVE_PROGRAM_STATE);

  if (
    !isAdaptiveWeekEligible(input.weekIndex, input.config) ||
    !isAdaptiveTrainingModeEligible(input.trainingMode) ||
    !isQualifyingAdaptiveRating(input.rating)
  ) {
    return {
      state,
      weekQualified: false,
      newlyQualified: false,
      newItemCount: 0,
      shouldPresentCoach: false,
    };
  }

  const weekKey = getAdaptiveWeekKey(input.programId, input.weekIndex);
  const existingWeek =
    state.weekly[weekKey] ?? createEmptyWeek(input.programId, input.weekIndex);
  const week: AdaptiveWeeklyState = {
    ...existingWeek,
    qualifyingWorkouts: [...existingWeek.qualifyingWorkouts],
    queuedSetWorkoutKeys: [...(existingWeek.queuedSetWorkoutKeys ?? [])],
    queuedOptionalWorkoutKeys: [...(existingWeek.queuedOptionalWorkoutKeys ?? [])],
  };

  if (week.qualifyingWorkouts.some((w) => w.workoutKey === input.workoutKey)) {
    return {
      state,
      weekQualified: week.qualified,
      newlyQualified: false,
      newItemCount: 0,
      shouldPresentCoach: false,
    };
  }

  const qualifyingWorkout: AdaptiveQualifyingWorkout = {
    workoutKey: input.workoutKey,
    dayId: input.dayId,
    dayIndex: input.dayIndex,
    rating: input.rating,
    setCandidate: input.setCandidate,
    rating5OptionalExerciseId:
      input.rating === 5 ? input.rating5OptionalExerciseId : undefined,
  };
  week.qualifyingWorkouts.push(qualifyingWorkout);

  const threshold = clampAdaptiveRatingThresholdForProgram(
    input.config.weeklyQualifyingRatingCount,
    input.programDayCount,
  );
  const wasQualified = week.qualified;
  week.qualified = week.qualifyingWorkouts.length >= threshold;
  state.weekly[weekKey] = week;

  if (!week.qualified) {
    return {
      state,
      weekQualified: false,
      newlyQualified: false,
      newItemCount: 0,
      shouldPresentCoach: false,
    };
  }

  const recommendation = {
    ...(state.pendingRecommendations[weekKey] ??
      createEmptyRecommendation(input.programId, input.weekIndex)),
  };
  recommendation.items = [...recommendation.items];
  recommendation.closed = false;

  let newItemCount = 0;

  for (const workout of week.qualifyingWorkouts) {
    if (workout.setCandidate && !week.queuedSetWorkoutKeys.includes(workout.workoutKey)) {
      const candidate = workout.setCandidate;
      const id = setOfferId(candidate);
      const alreadyOffered = recommendation.items.some((item) => item.id === id);
      if (!alreadyOffered) {
        recommendation.items.push({
          id,
          type: "set-increase",
          programId: candidate.programId,
          weekIndex: candidate.weekIndex,
          dayId: candidate.dayId,
          dayIndex: candidate.dayIndex,
          exerciseId: candidate.exerciseId,
          sourceWorkoutKey: workout.workoutKey,
          selected: true,
          fromSets: candidate.fromSets,
          toSets: candidate.toSets,
        });
        newItemCount++;
      }
      week.queuedSetWorkoutKeys.push(workout.workoutKey);
    }

    if (
      workout.rating === 5 &&
      workout.rating5OptionalExerciseId &&
      !week.queuedOptionalWorkoutKeys.includes(workout.workoutKey)
    ) {
      const exerciseKey = getAdaptiveExerciseKey(
        input.programId,
        workout.dayId,
        workout.rating5OptionalExerciseId,
      );
      const id = optionalOfferId(
        input.programId,
        input.weekIndex,
        workout.dayId,
        workout.rating5OptionalExerciseId,
      );
      const alreadyActivated = state.activatedOptionalExercises[exerciseKey] != null;
      const alreadyOffered = recommendation.items.some((item) => item.id === id);

      if (!alreadyActivated && !alreadyOffered) {
        recommendation.items.push({
          id,
          type: "optional-activation",
          programId: input.programId,
          weekIndex: input.weekIndex,
          dayId: workout.dayId,
          dayIndex: workout.dayIndex,
          exerciseId: workout.rating5OptionalExerciseId,
          sourceWorkoutKey: workout.workoutKey,
          selected: true,
        });
        newItemCount++;
      }
      week.queuedOptionalWorkoutKeys.push(workout.workoutKey);
    }
  }

  state.weekly[weekKey] = week;
  state.pendingRecommendations[weekKey] = recommendation;

  return {
    state,
    weekQualified: true,
    newlyQualified: !wasQualified,
    newItemCount,
    shouldPresentCoach: newItemCount > 0,
  };
}

/** Apply the current checkbox selection to the live prescription, reversibly. */
export function applyAdaptiveRecommendationSelection(input: {
  state: AdaptiveProgramState;
  programId: string;
  weekIndex: number;
  selectedItemIds: string[];
}): AdaptiveProgramState {
  const state = cloneState(input.state);
  const weekKey = getAdaptiveWeekKey(input.programId, input.weekIndex);
  const recommendation = state.pendingRecommendations[weekKey];
  if (!recommendation || recommendation.closed) return state;

  const selectedIds = new Set(input.selectedItemIds);
  const items = recommendation.items.map((item) => ({
    ...item,
    selected: selectedIds.has(item.id),
  }));

  for (const item of items) {
    const exerciseKey = getAdaptiveExerciseKey(
      item.programId,
      item.dayId,
      item.exerciseId,
    );

    if (item.type === "set-increase") {
      const fromSets = item.fromSets ?? 0;
      const toSets = item.toSets ?? fromSets;

      if (item.selected) {
        state.setOverrides[exerciseKey] = {
          programId: item.programId,
          dayId: item.dayId,
          dayIndex: item.dayIndex,
          exerciseId: item.exerciseId,
          sets: toSets,
          updatedAtWeekIndex: item.weekIndex,
        };
      } else {
        const existing = state.setOverrides[exerciseKey];
        if (existing?.updatedAtWeekIndex === item.weekIndex && existing.sets === toSets) {
          if (fromSets > 0) {
            state.setOverrides[exerciseKey] = {
              ...existing,
              sets: fromSets,
              updatedAtWeekIndex: Math.max(0, item.weekIndex - 1),
            };
          } else {
            delete state.setOverrides[exerciseKey];
          }
        }
      }
    } else {
      if (item.selected) {
        state.activatedOptionalExercises[exerciseKey] = {
          programId: item.programId,
          dayId: item.dayId,
          dayIndex: item.dayIndex,
          exerciseId: item.exerciseId,
          activatedAtWeekIndex: item.weekIndex,
        };
      } else {
        const existing = state.activatedOptionalExercises[exerciseKey];
        if (existing?.activatedAtWeekIndex === item.weekIndex) {
          delete state.activatedOptionalExercises[exerciseKey];
        }
      }
    }
  }

  state.pendingRecommendations[weekKey] = {
    ...recommendation,
    items,
    lastPresentedItemCount: items.length,
  };

  return state;
}

export function closeAdaptiveWeekReview(input: {
  state: AdaptiveProgramState;
  programId: string;
  weekIndex: number;
  selectedItemIds: string[];
}): AdaptiveProgramState {
  const applied = applyAdaptiveRecommendationSelection(input);
  const weekKey = getAdaptiveWeekKey(input.programId, input.weekIndex);
  const recommendation = applied.pendingRecommendations[weekKey];
  if (!recommendation) return applied;

  applied.pendingRecommendations[weekKey] = {
    ...recommendation,
    closed: true,
    lastPresentedItemCount: recommendation.items.length,
  };
  return applied;
}

export function hasOpenAdaptiveWeekOffers(
  state: AdaptiveProgramState,
  programId: string,
  weekIndex: number,
): boolean {
  const recommendation = state.pendingRecommendations[
    getAdaptiveWeekKey(programId, weekIndex)
  ];
  return !!recommendation && !recommendation.closed && recommendation.items.length > 0;
}

// Backward-compatible wrappers for any older direct call sites.
export type AcceptAdaptiveRecommendationResult = {
  state: AdaptiveProgramState;
  acceptedSetCandidates: AdaptiveWorkoutSetCandidate[];
  activatedOptionalExerciseIds: string[];
};

export function acceptAdaptiveRecommendation(input: {
  state: AdaptiveProgramState;
  programId: string;
  weekIndex: number;
}): AcceptAdaptiveRecommendationResult {
  const recommendation = input.state.pendingRecommendations[
    getAdaptiveWeekKey(input.programId, input.weekIndex)
  ];

  if (!recommendation || recommendation.closed) {
    return {
      state: cloneState(input.state),
      acceptedSetCandidates: [],
      activatedOptionalExerciseIds: [],
    };
  }

  const selectedItemIds = recommendation.items.map((item) => item.id);
  const state = applyAdaptiveRecommendationSelection({
    ...input,
    selectedItemIds,
  });

  return {
    state,
    acceptedSetCandidates: recommendation.items
      .filter((item) => item.type === "set-increase")
      .map((item) => ({
        programId: item.programId,
        weekIndex: item.weekIndex,
        dayId: item.dayId,
        dayIndex: item.dayIndex,
        exerciseId: item.exerciseId,
        fromSets: item.fromSets ?? 0,
        toSets: item.toSets ?? item.fromSets ?? 0,
        overperformanceScore: 0,
      })),
    activatedOptionalExerciseIds: recommendation.items
      .filter((item) => item.type === "optional-activation")
      .map((item) => item.exerciseId),
  };
}

export function declineAdaptiveRecommendation(input: {
  state: AdaptiveProgramState;
  programId: string;
  weekIndex: number;
}): AdaptiveProgramState {
  const recommendation = input.state.pendingRecommendations[
    getAdaptiveWeekKey(input.programId, input.weekIndex)
  ];
  if (!recommendation) return cloneState(input.state);
  return applyAdaptiveRecommendationSelection({
    ...input,
    selectedItemIds: [],
  });
}

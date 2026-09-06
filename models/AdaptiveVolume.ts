// models/AdaptiveVolume.ts

export type AdaptiveSetOverride = {
  programId: string;
  dayId: string;
  dayIndex: number;
  exerciseId: string;
  sets: number;
  updatedAtWeekIndex: number;
};

export type ActivatedOptionalExercise = {
  programId: string;
  dayId: string;
  dayIndex: number;
  exerciseId: string;
  activatedAtWeekIndex: number;
};

export type AdaptiveWorkoutSetCandidate = {
  programId: string;
  weekIndex: number;
  dayId: string;
  dayIndex: number;
  exerciseId: string;
  fromSets: number;
  toSets: number;
  overperformanceScore: number;
};

export type AdaptiveQualifyingWorkout = {
  workoutKey: string;
  dayId: string;
  dayIndex: number;
  rating: 4 | 5;
  setCandidate?: AdaptiveWorkoutSetCandidate;
  rating5OptionalExerciseId?: string;
};

export type AdaptiveOptionalActivationCandidate = {
  workoutKey: string;
  programId: string;
  weekIndex: number;
  dayId: string;
  dayIndex: number;
  exerciseId: string;
};

export type AdaptiveRecommendationItemType =
  | "set-increase"
  | "optional-activation";

/**
 * One reversible adaptive-volume offer for a program week.
 * `selected` is the user's current choice for the week and may be changed
 * again until the weekly review is closed.
 */
export type AdaptiveRecommendationItem = {
  id: string;
  type: AdaptiveRecommendationItemType;
  programId: string;
  weekIndex: number;
  dayId: string;
  dayIndex: number;
  exerciseId: string;
  sourceWorkoutKey: string;
  selected: boolean;
  fromSets?: number;
  toSets?: number;
};

/**
 * All adaptive offers earned during one program week.
 * The collection intentionally remains available after a mid-week Coach visit
 * so the user can revise earlier choices on later visits and at final review.
 */
export type PendingAdaptiveRecommendation = {
  programId: string;
  weekIndex: number;
  items: AdaptiveRecommendationItem[];
  /** Number of items the Coach had seen on the previous visit. */
  lastPresentedItemCount: number;
  /** Final review has been completed and the week's adaptive decisions locked. */
  closed: boolean;
};

export type AdaptiveWeeklyState = {
  programId: string;
  weekIndex: number;
  qualifyingWorkouts: AdaptiveQualifyingWorkout[];
  qualified: boolean;
  queuedSetWorkoutKeys: string[];
  queuedOptionalWorkoutKeys: string[];
};

export type AdaptiveProgramState = {
  /** Current live accepted prescription. */
  setOverrides: Record<string, AdaptiveSetOverride>;
  activatedOptionalExercises: Record<string, ActivatedOptionalExercise>;
  weekly: Record<string, AdaptiveWeeklyState>;
  /** Weekly offer history/review state. Key: `${programId}:${weekIndex}` */
  pendingRecommendations: Record<string, PendingAdaptiveRecommendation>;
};

export const EMPTY_ADAPTIVE_PROGRAM_STATE: AdaptiveProgramState = {
  setOverrides: {},
  activatedOptionalExercises: {},
  weekly: {},
  pendingRecommendations: {},
};

export function normalizeAdaptiveProgramState(
  state: Partial<AdaptiveProgramState> | null | undefined,
): AdaptiveProgramState {
  const pendingRecommendations: Record<string, PendingAdaptiveRecommendation> = {};

  for (const [key, raw] of Object.entries(state?.pendingRecommendations ?? {})) {
    const legacy = raw as PendingAdaptiveRecommendation & {
      setCandidates?: AdaptiveWorkoutSetCandidate[];
      optionalActivations?: Array<{
        workoutKey: string;
        programId: string;
        weekIndex: number;
        dayId: string;
        dayIndex: number;
        exerciseId: string;
      }>;
    };

    if (Array.isArray(legacy.items)) {
      pendingRecommendations[key] = {
        ...legacy,
        items: legacy.items.map((item) => ({ ...item })),
        lastPresentedItemCount: legacy.lastPresentedItemCount ?? 0,
        closed: legacy.closed ?? false,
      };
      continue;
    }

    const items: AdaptiveRecommendationItem[] = [];

    for (const candidate of legacy.setCandidates ?? []) {
      items.push({
        id: `set:${candidate.programId}:${candidate.weekIndex}:${candidate.dayId}:${candidate.exerciseId}:${candidate.fromSets}->${candidate.toSets}`,
        type: "set-increase",
        programId: candidate.programId,
        weekIndex: candidate.weekIndex,
        dayId: candidate.dayId,
        dayIndex: candidate.dayIndex,
        exerciseId: candidate.exerciseId,
        sourceWorkoutKey: `legacy:${candidate.dayId}:${candidate.exerciseId}`,
        selected: false,
        fromSets: candidate.fromSets,
        toSets: candidate.toSets,
      });
    }

    for (const activation of legacy.optionalActivations ?? []) {
      items.push({
        id: `optional:${activation.programId}:${activation.weekIndex}:${activation.dayId}:${activation.exerciseId}`,
        type: "optional-activation",
        programId: activation.programId,
        weekIndex: activation.weekIndex,
        dayId: activation.dayId,
        dayIndex: activation.dayIndex,
        exerciseId: activation.exerciseId,
        sourceWorkoutKey: activation.workoutKey ?? `legacy:${activation.dayId}:${activation.exerciseId}`,
        selected: false,
      });
    }

    pendingRecommendations[key] = {
      programId: legacy.programId,
      weekIndex: legacy.weekIndex,
      items,
      lastPresentedItemCount: 0,
      closed: false,
    };
  }

  return {
    setOverrides: { ...(state?.setOverrides ?? {}) },
    activatedOptionalExercises: {
      ...(state?.activatedOptionalExercises ?? {}),
    },
    weekly: { ...(state?.weekly ?? {}) },
    pendingRecommendations,
  };
}

export function getAdaptiveExerciseKey(
  programId: string,
  dayId: string,
  exerciseId: string,
): string {
  return `${programId}:${dayId}:${exerciseId}`;
}

export function getAdaptiveWeekKey(programId: string, weekIndex: number): string {
  return `${programId}:${weekIndex}`;
}

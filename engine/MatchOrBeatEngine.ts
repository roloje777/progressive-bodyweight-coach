// engine/MatchOrBeatEngine.ts

import {
  HydratedExercise,
  MatchOrBeatTarget,
  ProgramExercise,
} from "@/models/Exercise";
import { CompletedSession } from "@/models/WorkoutLog";

type HistoricalSet = {
  setNumber?: number;
  status?: string;

  repsCompleted?: number;
  repsLeft?: number;
  repsRight?: number;

  durationSeconds?: number;
  durationLeft?: number;
  durationRight?: number;
};

/**
 * Extract the measurable performance value from a set.
 *
 * Skipped sets deliberately return null.
 *
 * This means a skipped historical set is never treated
 * as a failed Match-or-Beat result.
 */
function getSetValue(set: HistoricalSet): number | null {
  if (set.status === "skipped") {
    return null;
  }

  if (set.repsCompleted != null) {
    return set.repsCompleted;
  }

  if (set.repsLeft != null && set.repsRight != null) {
    return Math.round((set.repsLeft + set.repsRight) / 2);
  }

  if (set.durationSeconds != null) {
    return set.durationSeconds;
  }

  if (set.durationLeft != null && set.durationRight != null) {
    return Math.round((set.durationLeft + set.durationRight) / 2);
  }

  return null;
}

/**
 * -------------------------------------------------------
 * VALID HISTORICAL MB SOURCE
 * -------------------------------------------------------
 *
 * Historical performance may only establish a future
 * Match-or-Beat target when the workout represents a
 * healthy / valid performance exposure.
 *
 * We deliberately reject workouts containing:
 *
 * - joint discomfort
 * - form breakdown
 * - low energy / fatigue
 * - difficulty rating 1–2
 *
 * Those workouts still remain in workout history and
 * still affect readiness for the week in which they
 * occurred.
 *
 * They simply do NOT lower the athlete's future
 * Match-or-Beat baseline.
 */
function isValidHistoricalMBSource(workout: CompletedSession): boolean {
  const feedback = workout.feedback;

  const tags = feedback?.tags ?? [];

  const rating = feedback?.rating;

  if (rating != null && rating <= 2) {
    return false;
  }

  if (tags.includes("Joint discomfort ⚠️")) {
    return false;
  }

  if (tags.includes("Form broke down")) {
    return false;
  }

  if (tags.includes("Low energy 😴")) {
    return false;
  }

  return true;
}

/**
 * -------------------------------------------------------
 * CONFIGURED FIRST-USE FALLBACK
 * -------------------------------------------------------
 *
 * Used only when no historical or current-workout
 * performance exists.
 *
 * The fallback is derived directly from the exercise's
 * configured starting prescription.
 *
 * Reps:
 *   midpoint of minReps and maxReps
 *
 *   (minReps + maxReps) / 2
 *
 *   rounded up.
 *
 * Example:
 *
 *   minReps = 10
 *   maxReps = 15
 *
 *   (10 + 15) / 2 = 12.5
 *   → 13
 *
 * Hold / time:
 *   70% of configured durationSeconds
 *
 * Example:
 *
 *   durationSeconds = 45
 *
 *   45 × 0.7 = 31.5
 *   → 32
 *
 * Tempo:
 *   midpoint of minReps and maxReps,
 *   rounded up.
 *
 * The fallback is deliberately kept inside
 * MatchOrBeatEngine so target generation remains
 * entirely owned by this engine.
 */
function getConfiguredFallback(
  exercise: HydratedExercise | ProgramExercise | any,
): number | null {
  const config = exercise?.config;

  if (!config) {
    return null;
  }

  // -----------------------------------
  // HOLD / TIME
  // -----------------------------------

  if (config.durationSeconds != null && config.durationSeconds > 0) {
    return Math.max(1, Math.ceil(config.durationSeconds * 0.7));
  }

  // -----------------------------------
  // REPS / TEMPO
  // -----------------------------------

  if (
    config.minReps != null &&
    config.maxReps != null &&
    config.minReps > 0 &&
    config.maxReps > 0
  ) {
    return Math.max(1, Math.ceil((config.minReps + config.maxReps) / 2));
  }

  return null;
}

/**
 * -------------------------------------------------------
 * HISTORICAL SAME-SET TARGET
 * -------------------------------------------------------
 *
 * Find the latest valid result for:
 *
 *   same exercise
 *   + same set position
 *
 * History is searched newest → oldest.
 *
 * Skipped historical sets are ignored and the search
 * continues backwards.
 */
function findHistoricalSameSetTarget(
  exerciseId: string,
  setNumber: number,
  workoutHistory: CompletedSession[],
): number | null {
  for (let i = workoutHistory.length - 1; i >= 0; i--) {
    const workout = workoutHistory[i];

    if (!isValidHistoricalMBSource(workout)) {
      continue;
    }

    const exercise = workout.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId,
    );

    if (!exercise) {
      continue;
    }

    const historicalSet = exercise.sets.find(
      (set) => set.setNumber === setNumber,
    );

    if (!historicalSet) {
      continue;
    }

    const value = getSetValue(historicalSet);

    if (value != null && value > 0) {
      return value;
    }
  }

  return null;
}

/**
 * -------------------------------------------------------
 * HISTORICAL PREVIOUS-SET TARGET
 * -------------------------------------------------------
 *
 * If the same set position has no historical result,
 * search for the nearest earlier set position.
 *
 * Example:
 *
 * Current Set 3
 *
 * Historical fallback:
 *
 *   Set 2
 *   then Set 1
 *
 * History is searched newest → oldest.
 *
 * Skipped historical sets are ignored.
 */
function findHistoricalPreviousSetTarget(
  exerciseId: string,
  setNumber: number,
  workoutHistory: CompletedSession[],
): number | null {
  if (setNumber <= 1) {
    return null;
  }

  for (let i = workoutHistory.length - 1; i >= 0; i--) {
    const workout = workoutHistory[i];

    if (!isValidHistoricalMBSource(workout)) {
      continue;
    }

    const exercise = workout.exercises.find(
      (exercise) => exercise.exerciseId === exerciseId,
    );

    if (!exercise) {
      continue;
    }

    for (
      let previousSetNumber = setNumber - 1;
      previousSetNumber >= 1;
      previousSetNumber--
    ) {
      const previousSet = exercise.sets.find(
        (set) => set.setNumber === previousSetNumber,
      );

      if (!previousSet) {
        continue;
      }

      const value = getSetValue(previousSet);

      if (value != null && value > 0) {
        return value;
      }
    }
  }

  return null;
}

/**
 * -------------------------------------------------------
 * CURRENT WORKOUT PREVIOUS-SET TARGET
 * -------------------------------------------------------
 *
 * Used only after historical lookup fails.
 *
 * Example:
 *
 * Current workout:
 *
 * Set 1 → completed 10
 * Set 2 → current
 *
 * Set 2 target = 10
 *
 * Skipped current sets are ignored.
 */
function findCurrentWorkoutPreviousSet(
  sets: HistoricalSet[],
  currentSetNumber: number,
): number | null {
  if (currentSetNumber <= 1) {
    return null;
  }

  for (let setNumber = currentSetNumber - 1; setNumber >= 1; setNumber--) {
    const previousSet = sets.find((set) => set.setNumber === setNumber);

    if (!previousSet) {
      continue;
    }

    const value = getSetValue(previousSet);

    if (value != null && value > 0) {
      return value;
    }
  }

  return null;
}

/**
 * -------------------------------------------------------
 * MATCH-OR-BEAT TARGET GENERATION
 * -------------------------------------------------------
 *
 * Target generation belongs entirely inside this engine.
 *
 * Lookup hierarchy:
 *
 * 1. Historical same exercise + same set
 * 2. Historical previous set
 * 3. Current workout previous set
 * 4. Configured first-use fallback
 * 5. No target
 *
 * Historical skipped sets are ignored.
 */
export function getMatchOrBeatTargets(
  matchedExercise: any,
  workoutHistory: CompletedSession[] = [],
  exerciseId?: string,
  configuredExercise?: HydratedExercise | ProgramExercise,
): MatchOrBeatTarget[] {
  if (!matchedExercise?.sets?.length) {
    return [];
  }

  const resolvedExerciseId = exerciseId ?? matchedExercise.exerciseId;

  const configuredFallback = getConfiguredFallback(
    configuredExercise ?? matchedExercise,
  );

  return matchedExercise.sets.map((set: HistoricalSet, index: number) => {
    const setNumber = set.setNumber ?? index + 1;

    // -----------------------------------
    // 1. HISTORICAL SAME SET
    // -----------------------------------

    const historicalSameSet = resolvedExerciseId
      ? findHistoricalSameSetTarget(
          resolvedExerciseId,
          setNumber,
          workoutHistory,
        )
      : null;

    if (historicalSameSet != null && historicalSameSet > 0) {
      return {
        setNumber,
        target: historicalSameSet,
        source: "historicalSameSet",
      };
    }

    // -----------------------------------
    // 2. HISTORICAL PREVIOUS SET
    // -----------------------------------

    const historicalPreviousSet = resolvedExerciseId
      ? findHistoricalPreviousSetTarget(
          resolvedExerciseId,
          setNumber,
          workoutHistory,
        )
      : null;

    if (historicalPreviousSet != null && historicalPreviousSet > 0) {
      return {
        setNumber,
        target: historicalPreviousSet,
        source: "historicalPreviousSet",
      };
    }

    // -----------------------------------
    // 3. CURRENT WORKOUT PREVIOUS SET
    // -----------------------------------

    const currentWorkoutPreviousSet = findCurrentWorkoutPreviousSet(
      matchedExercise.sets,
      setNumber,
    );

    if (currentWorkoutPreviousSet != null && currentWorkoutPreviousSet > 0) {
      return {
        setNumber,
        target: currentWorkoutPreviousSet,
        source: "currentWorkoutPreviousSet",
      };
    }

    // -----------------------------------
    // 4. CONFIGURED FIRST-USE FALLBACK
    // -----------------------------------

    if (configuredFallback != null && configuredFallback > 0) {
      return {
        setNumber,
        target: configuredFallback,
        source: "configuredFallback",
      };
    }

    // -----------------------------------
    // 5. NO TARGET
    // -----------------------------------

    return {
      setNumber,
      target: null,
      source: "none",
    };
  });
}

import { MatchOrBeatTarget } from "@/models/Exercise";
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

function getSetValue(set: HistoricalSet): number | null {
  if (set.status === "skipped") {
    return null;
  }

  if (set.repsCompleted != null) {
    return set.repsCompleted;
  }

  if (
    set.repsLeft != null &&
    set.repsRight != null
  ) {
    return Math.round(
      (set.repsLeft + set.repsRight) / 2,
    );
  }

  if (set.durationSeconds != null) {
    return set.durationSeconds;
  }

  if (
    set.durationLeft != null &&
    set.durationRight != null
  ) {
    return Math.round(
      (set.durationLeft + set.durationRight) / 2,
    );
  }

  return null;
}

/**
 * Find the latest valid result for the same
 * exercise + same set position.
 *
 * Skipped sets are ignored and history continues
 * backwards until a valid result is found.
 */
function findHistoricalSameSetTarget(
  exerciseId: string,
  setNumber: number,
  workoutHistory: CompletedSession[],
): number | null {
  for (let i = workoutHistory.length - 1; i >= 0; i--) {
    const workout = workoutHistory[i];

    const exercise = workout.exercises.find(
      (e) => e.exerciseId === exerciseId,
    );

    if (!exercise) continue;

    const historicalSet = exercise.sets.find(
      (set) => set.setNumber === setNumber,
    );

    if (!historicalSet) continue;

    const value = getSetValue(historicalSet);

    if (value != null && value > 0) {
      return value;
    }
  }

  return null;
}

/**
 * Find the latest valid previous set in history.
 *
 * Example:
 *
 * target Set 2
 *
 * Look for Set 1 in the most recent workout
 * that contains a valid Set 1 result.
 *
 * If unavailable, continue backwards through history.
 */
function findHistoricalPreviousSetTarget(
  exerciseId: string,
  setNumber: number,
  workoutHistory: CompletedSession[],
): number | null {
  for (let i = workoutHistory.length - 1; i >= 0; i--) {
    const workout = workoutHistory[i];

    const exercise = workout.exercises.find(
      (e) => e.exerciseId === exerciseId,
    );

    if (!exercise) continue;

    for (
      let previousSetNumber = setNumber - 1;
      previousSetNumber >= 1;
      previousSetNumber--
    ) {
      const previousSet = exercise.sets.find(
        (set) => set.setNumber === previousSetNumber,
      );

      if (!previousSet) continue;

      const value = getSetValue(previousSet);

      if (value != null && value > 0) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Find a previous completed set from the
 * currently matched workout.
 *
 * This is only used after historical same-position
 * and historical previous-set searches fail.
 */
function findCurrentWorkoutPreviousSet(
  sets: HistoricalSet[],
  currentSetNumber: number,
): number | null {
  for (
    let setNumber = currentSetNumber - 1;
    setNumber >= 1;
    setNumber--
  ) {
    const previousSet = sets.find(
      (set) => set.setNumber === setNumber,
    );

    if (!previousSet) continue;

    const value = getSetValue(previousSet);

    if (value != null && value > 0) {
      return value;
    }
  }

  return null;
}

export function getMatchOrBeatTargets(
  matchedExercise: any,
  workoutHistory: CompletedSession[] = [],
  exerciseId?: string,
): MatchOrBeatTarget[] {
  if (!matchedExercise?.sets?.length) {
    return [];
  }

  const resolvedExerciseId =
    exerciseId ?? matchedExercise.exerciseId;

  return matchedExercise.sets.map(
    (set: HistoricalSet, index: number) => {
      const setNumber =
        set.setNumber ?? index + 1;

      // -----------------------------------
      // 1. SAME SET POSITION IN HISTORY
      // -----------------------------------

      const historicalSameSet =
        resolvedExerciseId
          ? findHistoricalSameSetTarget(
              resolvedExerciseId,
              setNumber,
              workoutHistory,
            )
          : null;

      if (
        historicalSameSet != null &&
        historicalSameSet > 0
      ) {
        return {
          setNumber,
          target: historicalSameSet,
          source: "historicalSameSet",
        };
      }

      // -----------------------------------
      // 2. PREVIOUS SET FROM HISTORY
      // -----------------------------------

      const historicalPreviousSet =
        resolvedExerciseId
          ? findHistoricalPreviousSetTarget(
              resolvedExerciseId,
              setNumber,
              workoutHistory,
            )
          : null;

      if (
        historicalPreviousSet != null &&
        historicalPreviousSet > 0
      ) {
        return {
          setNumber,
          target: historicalPreviousSet,
          source: "historicalPreviousSet",
        };
      }

      // -----------------------------------
      // 3. CURRENT WORKOUT PREVIOUS SET
      // -----------------------------------

      const currentWorkoutPreviousSet =
        findCurrentWorkoutPreviousSet(
          matchedExercise.sets,
          setNumber,
        );

      if (
        currentWorkoutPreviousSet != null &&
        currentWorkoutPreviousSet > 0
      ) {
        return {
          setNumber,
          target: currentWorkoutPreviousSet,
          source: "currentWorkoutPreviousSet",
        };
      }

      // -----------------------------------
      // 4. NO TARGET
      // -----------------------------------

      return {
        setNumber,
        target: null,
        source: "none",
      };
    },
  );
}
import { MatchOrBeatTarget } from "@/models/Exercise";

export function getMatchOrBeatTargets(
  matchedExercise: any,
): MatchOrBeatTarget[] {
  if (!matchedExercise?.sets?.length) {
    return [];
  }

  return matchedExercise.sets.map((set: any, index: number) => {
    let target = 0;

    // reps
    if (set.repsCompleted != null) {
      target = set.repsCompleted;
    }

    // unilateral reps
    else if (
      set.repsLeft != null &&
      set.repsRight != null
    ) {
      target = Math.round(
        (set.repsLeft + set.repsRight) / 2
      );
    }

    // holds
    else if (set.durationSeconds != null) {
      target = set.durationSeconds;
    }

    // unilateral holds
    else if (
      set.durationLeft != null &&
      set.durationRight != null
    ) {
      target = Math.round(
        (set.durationLeft + set.durationRight) / 2
      );
    }

    return {
      setNumber: index + 1,
      target,
    };
  });
}
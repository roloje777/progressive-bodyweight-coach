import { Exercise } from "@/models/Exercise";
import { ExerciseAdaptiveState }
  from "@/models/ExerciseAdaptiveState";

export function applyAdaptiveProgression(
  exercise: Exercise,
  state?: ExerciseAdaptiveState,
): Exercise {
  if (!state) return exercise;

  const config: any = {
    ...exercise.config,
  };

  // -----------------------------
  // REPS
  // -----------------------------

  if (config.minReps != null) {
    config.minReps += state.repsBonus;
  }

  if (config.maxReps != null) {
    config.maxReps += state.repsBonus;
  }

  // -----------------------------
  // SETS
  // -----------------------------

  const sets =
    exercise.sets + state.extraSets;

  return {
    ...exercise,

    sets: Math.max(1, sets),

    config,
  };
}
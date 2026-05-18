import { exerciseRegistry } from "../data/exerciseRegistry";

type ExerciseLike = {
  exerciseId?: string;
  id?: string;
};

export function hydrateExercise<T extends ExerciseLike>(exercise: T) {
  // ✅ support BOTH old + new formats temporarily
  const exerciseId = exercise.exerciseId || exercise.id;

  if (!exerciseId) {
    console.log(
      "❌ Invalid exercise passed to hydrateExercise:",
      JSON.stringify(exercise, null, 2),
    );

    debugger;

    throw new Error("Exercise missing exerciseId/id");
  }

  const registryExercise = exerciseRegistry[exerciseId];

  if (!registryExercise) {
    throw new Error(`Missing exercise: ${exerciseId}`);
  }

  return {
    ...registryExercise,
    ...exercise,
    exerciseId,
  };
}

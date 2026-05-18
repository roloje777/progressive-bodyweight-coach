import { Exercise } from "../models/Exercise";

export function applyDeload(
  exercise: Exercise,
): Exercise {
  return {
    ...exercise,

    sets: Math.max(2, Math.floor(exercise.sets * 0.6)),

    config: {
      ...(exercise.config as any),

      maxReps:
        (exercise.config as any)?.maxReps != null
          ? Math.max(
              4,
              Math.floor((exercise.config as any).maxReps * 0.7),
            )
          : undefined,
    },
  };
}
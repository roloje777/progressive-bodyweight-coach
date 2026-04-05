// utils/estimateSessionDuration.ts

import { NormalizedExercise } from "./normalizeExercises";

export function estimateSessionDuration(
  exercises: NormalizedExercise[],
  restBetweenSets: number = 20,
  restBetweenExercises: number = 30
): number {
  let totalSeconds = 0;

  exercises.forEach((ex, index) => {
    const secondsPerSet = ex.secondsPerSet ?? 0;
    const sets = ex.sets ?? 1;

    totalSeconds += secondsPerSet * sets;

    // 🔥 Choose rest based on category
    const isMain = ex.category === "main";

    const setRest = isMain ? restBetweenSets : 10;
    const exerciseRest = isMain ? restBetweenExercises : 10;

    // Rest between sets
    totalSeconds += setRest * (sets - 1);

    // Rest between exercises
    if (index < exercises.length - 1) {
      totalSeconds += exerciseRest;
    }
  });

  return totalSeconds;
}
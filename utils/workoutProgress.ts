    export interface WorkoutProgress {
  totalSets: number;
  completedSets: number;
  completionPercent: number;
}

export function calculateWorkoutProgress(
  completedSets: number,
  totalSets: number,
): WorkoutProgress {
  const completionPercent =
    totalSets === 0
      ? 0
      : Math.round((completedSets / totalSets) * 100);

  return {
    totalSets,
    completedSets,
    completionPercent,
  };
}
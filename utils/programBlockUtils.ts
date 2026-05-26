import { CompletedWorkout } from "../models/WorkoutLog";

export function getCompletedProgramWeeks(
  workoutHistory: CompletedWorkout[],
  programId: string,
): number {
  const matching = workoutHistory.filter(
    (w) => w.programId === programId,
  );

  const uniqueWeeks = new Set<string>();

  matching.forEach((workout) => {
    // Example:
    // "2026-W18"
    const date = new Date(workout.date);

    const firstJan = new Date(date.getFullYear(), 0, 1);

    const days = Math.floor(
      (date.getTime() - firstJan.getTime()) /
        (24 * 60 * 60 * 1000),
    );

    const week = Math.ceil((days + firstJan.getDay() + 1) / 7);

    uniqueWeeks.add(`${date.getFullYear()}-W${week}`);
  });

  return uniqueWeeks.size;
}

export function isProgramBlockComplete(
  completedWeeks: number,
  blockLength: number,
): boolean {
  return completedWeeks >= blockLength;
}
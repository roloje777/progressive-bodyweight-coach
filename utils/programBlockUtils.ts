import { CompletedSession } from "../models/WorkoutLog";

export function getCompletedProgramWeeks(
  workoutHistory: CompletedSession[],
  programId: string,
): number {
  const uniqueWeeks = new Set<number>();

  workoutHistory.forEach((workout) => {
    if (workout.programId !== programId) return;
    if (workout.weekIndex == null) return;

    uniqueWeeks.add(workout.weekIndex);
  });

  return uniqueWeeks.size;
}

export function isProgramBlockComplete(
  completedWeeks: number,
  blockLength: number,
): boolean {
  return completedWeeks >= blockLength;
}
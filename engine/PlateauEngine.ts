import { CompletedWorkout } from "../models/WorkoutLog";

export function detectPlateau(
  history: CompletedWorkout[],
): boolean {
  if (history.length < 4) return false;

  const recent = history.slice(-4);

  const ratings = recent
    .map((w) => (w as any)?.feedback?.rating)
    .filter(Boolean);

  if (ratings.length < 4) return false;

  const avg =
    ratings.reduce((a, b) => a + b, 0) / ratings.length;

  return avg <= 3;
}
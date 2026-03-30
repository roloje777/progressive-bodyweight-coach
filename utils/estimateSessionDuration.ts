import { Exercise } from "../models/Exercise";
import { estimateWorkoutDuration } from "./estimateWorkoutDuration";

export function estimateSessionDuration(
  exercises: Exercise[],
  restBetweenSets: number = 20,
  restBetweenExercises: number = 30
): number {
  return estimateWorkoutDuration(
    {
      id: "session",
      title: "Full Session",
      exercises,
    },
    restBetweenSets,
    restBetweenExercises
  );
}
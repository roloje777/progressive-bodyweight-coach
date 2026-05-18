import { Exercise } from "../models/Exercise";
import { CompletedWorkout } from "../models/WorkoutLog";
import { ProgressionTree } from "../models/Graduation";
import { ExerciseGraduationState } from "../models/ExerciseGraduationState";

export interface GraduationResult {
  action:
    | "stay"
    | "graduate"
    | "regress"
    | "deload"
    | "reroute";

  nextExerciseId?: string;

  reason: string;
}

export function evaluateGraduation(
  exercise: Exercise,
  history: CompletedWorkout[],
  tree: ProgressionTree,
  state: ExerciseGraduationState,
): GraduationResult {
  const node = tree.nodes[state.currentNodeId];

  if (!node) {
    return {
      action: "stay",
      reason: "No progression node found",
    };
  }

  // -----------------------------
  // RECENT WORKOUTS
  // -----------------------------
}
import { HydratedExercise } from "../models/Exercise";
import { CompletedWorkout } from "../models/WorkoutLog";
import { ProgressionTree } from "../models/Graduation";
import { ExerciseGraduationState } from "../models/ExerciseGraduationState";

export interface ExerciseGraduationResult {
  action:
    | "stay"
    | "graduate"
    | "regress"
    | "deload"
    | "reroute";

  nextExerciseId?: string;

  reason: string;
}

export function evaluateExerciseGraduation(
  exercise: HydratedExercise,
  history: CompletedWorkout[],
  tree: ProgressionTree,
  state: ExerciseGraduationState,
): ExerciseGraduationResult {
  const node = tree.nodes[state.currentNodeId];

  if (!node) {
    return {
      action: "stay",
      reason: "No progression node found",
    };
  }

  // TODO:
  // analyze recent performance
  // analyze fatigue
  // determine progression readiness

  return {
    action: "stay",
    reason: "Progression analysis not implemented yet",
  };
}
//calculateWorkoutStats.ts
import rawExerciseGuide from "@/data/exerciseGuide.json";
import { ExerciseGuideMap } from "@/models/ExerciseGuide";

const exerciseGuide = rawExerciseGuide as ExerciseGuideMap;

type ExerciseInput = {
  id?: string;
  exerciseId?: string;
  sets?: number;
  reps?: number;
  type?: string;
  config?: any;
};

export function calculateWorkoutStats(dayWorkout: ExerciseInput[]) {
  let totalEffectiveness = 0;
  let totalDifficulty = 0;
  let totalSets = 0;
  let totalReps = 0;
  let exerciseCount = 0;
  let repExerciseCount = 0;

  dayWorkout.forEach((exercise) => {
    // ProgramExercise uses exerciseId; hydrated guide entries may use id.
    const exerciseId = exercise.exerciseId ?? exercise.id;
    if (!exerciseId) return;

    const guide = exerciseGuide[exerciseId];
    if (!guide) return;

    // Each exercise contributes once, regardless of sets, reps or hold time.
    totalEffectiveness += guide.effectiveness;
    totalDifficulty += guide.difficulty;

    const sets = exercise.sets || 1;

    totalSets += sets;

    // Only rep-based exercises contribute to avgReps
    if (exercise.type === "reps") {
      const reps = exercise.config?.maxReps ?? 0;

      totalReps += reps * sets;

      repExerciseCount++;
    }

    exerciseCount++;
  });

  return {
    effectiveness: exerciseCount
      ? totalEffectiveness / exerciseCount
      : 0,

    difficulty: exerciseCount
      ? totalDifficulty / exerciseCount
      : 0,

    avgSets: exerciseCount
      ? totalSets / exerciseCount
      : 0,

    avgReps: repExerciseCount
      ? totalReps / repExerciseCount
      : 0,
  };
}
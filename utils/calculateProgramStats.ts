//calculateProgramStats.ts
import { Program } from "@/models/Program";
import { calculateWorkoutStats } from "./calculateWorkoutStats";
import { exerciseRegistry } from "@/data/exerciseRegistry";


export function calculateProgramStats(program: Program) {
  let totalEffectiveness = 0;
  let totalDifficulty = 0;
  let totalDays = 0;
  let totalSets = 0;
let totalReps = 0;

  program.days.forEach((day) => {
    const hydratedExercises = day.exercises
      .map((exercise) => {
        const definition = exerciseRegistry[exercise.exerciseId];

        if (!definition) return null;

        return {
          ...definition,
          ...exercise,
        };
      })
      .filter((exercise): exercise is NonNullable<typeof exercise> => exercise != null);

    const stats = calculateWorkoutStats(hydratedExercises);

    totalEffectiveness += stats.effectiveness;
    totalDifficulty += stats.difficulty;
    totalDays++;
    totalSets += stats.avgSets;
    totalReps += stats.avgReps ?? 0;
  });

  return {
  avgEffectiveness: totalDays ? totalEffectiveness / totalDays : 0,
  avgDifficulty: totalDays ? totalDifficulty / totalDays : 0,
  avgSets: totalDays ? totalSets / totalDays : 0,
  avgReps: totalDays ? totalReps / totalDays : 0,
};
}
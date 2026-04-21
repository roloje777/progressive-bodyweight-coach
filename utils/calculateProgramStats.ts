import { Program } from "@/models/Program";
import { calculateWorkoutStats } from "./calculateWorkoutStats";


export function calculateProgramStats(program: Program) {
  let totalEffectiveness = 0;
  let totalDifficulty = 0;
  let totalDays = 0;
  let totalSets = 0;
let totalReps = 0;

  program.days.forEach((day) => {
    const stats = calculateWorkoutStats(day.exercises);

    totalEffectiveness += stats.effectiveness;
    totalDifficulty += stats.difficulty;
    totalDays++;
    totalSets += stats.avgSets;
totalReps += stats.avgReps;
  });

  return {
  avgEffectiveness: totalDays ? totalEffectiveness / totalDays : 0,
  avgDifficulty: totalDays ? totalDifficulty / totalDays : 0,
  avgSets: totalDays ? totalSets / totalDays : 0,
  avgReps: totalDays ? totalReps / totalDays : 0,
};
}
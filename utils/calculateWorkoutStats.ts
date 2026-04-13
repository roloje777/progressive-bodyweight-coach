import rawExerciseGuide from "@/data/exerciseGuide.json";
import { ExerciseGuideMap } from "@/models/ExerciseGuide";

const exerciseGuide = rawExerciseGuide as ExerciseGuideMap;

type ExerciseInput = {
  id: string;
  sets?: number;
  reps?: number;
  type?: string;
  config?: any;
};

export function calculateWorkoutStats(dayWorkout: ExerciseInput[]) {
  let totalEffectiveness = 0;
  let totalDifficulty = 0;
  let totalVolume = 0;

   console.log("xx number of exercises" + dayWorkout.length);
  dayWorkout.forEach((exercise) => {
    const guide = exerciseGuide[exercise.id];

    if (!guide) return;

    let volume = 1;

    if (exercise.type === "reps") {
      volume = (exercise.sets || 1) * (exercise.config?.maxReps || 1);
    } else if (exercise.type === "hold") {
      volume =
        (exercise.sets || 1) * (exercise.config?.durationSeconds || 1);
    } else {
      volume = exercise.sets || 1;
    }

    totalEffectiveness += guide.effectiveness * volume;
    totalDifficulty += guide.difficulty * volume;
    totalVolume += volume;
  });

  return {
    effectiveness: totalVolume ? totalEffectiveness / totalVolume : 0,
    difficulty: totalVolume ? totalDifficulty / totalVolume : 0,
  };
}
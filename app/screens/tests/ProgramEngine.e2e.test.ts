import { programs } from "@/data/programs";
import { ProgramEngine } from "@/engine/ProgramEngine";
import { getNextExerciseConfig } from "@/engine/ProgressEngine";
import { CompletedWorkout } from "@/models/WorkoutLog";
import { evaluateProgramReadiness } from "@/engine/ProgramReadinessEngine";
import { evaluateProgramGraduation } from "@/engine/ProgramGraduationEngine";
import { ProgramEvaluation } from "@/models/ProgramEvaluation";

type SimulationMode =
  | "easy"
  | "realistic"
  | "brutal"
  | "plateau"
  | "overtrained";

type SimulationConfig = {
  mode?: "full" | "custom";

  simulationMode?: SimulationMode;

  maxProgramIndex?: number;
  maxWeeks?: number;
  maxDays?: number;
};

// -----------------------------
// 🎲 RANDOM HELPERS
// -----------------------------

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// function randomRating() {
//   return rand(2, 5); // bias slightly away from constant failure
// }
function randomRating(min: number, max: number) {
  return rand(min, max);
}

function randomTags() {
  const tags: string[] = [];
  if (Math.random() < 0.2) tags.push("Form broke down");
  return tags;
}

// -----------------------------
// 🎯 SIMULATION PROFILES
// -----------------------------

function getSimulationProfile(mode: SimulationMode = "realistic") {
  switch (mode) {
    case "easy":
      return {
        repVarianceMin: 0,
        repVarianceMax: 5,

        failureChance: 0.02,

        ratingMin: 4,
        ratingMax: 5,

        fatiguePenaltyMin: 0,
        fatiguePenaltyMax: 1,
      };

    case "brutal":
      return {
        repVarianceMin: -8,
        repVarianceMax: 1,

        failureChance: 0.35,

        ratingMin: 1,
        ratingMax: 3,

        fatiguePenaltyMin: 2,
        fatiguePenaltyMax: 6,
      };

    case "plateau":
      return {
        repVarianceMin: -1,
        repVarianceMax: 1,

        failureChance: 0.12,

        ratingMin: 3,
        ratingMax: 4,

        fatiguePenaltyMin: 1,
        fatiguePenaltyMax: 2,
      };

    case "overtrained":
      return {
        repVarianceMin: -6,
        repVarianceMax: 0,

        failureChance: 0.45,

        ratingMin: 1,
        ratingMax: 2,

        fatiguePenaltyMin: 3,
        fatiguePenaltyMax: 8,
      };

    case "realistic":
    default:
      return {
        repVarianceMin: -3,
        repVarianceMax: 3,

        failureChance: 0.15,

        ratingMin: 2,
        ratingMax: 5,

        fatiguePenaltyMin: 1,
        fatiguePenaltyMax: 3,
      };
  }
}

// -----------------------------
// 💤 YIELD TO UI THREAD
// -----------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------------
// 🧪 SIMULATION
// -----------------------------
export async function runProgramE2ETest(config?: SimulationConfig) {
  // console.log("🚀 STARTING FULL PROGRAM SIMULATION\n");

  if (config?.mode === "custom") {
    console.log("\n🚀 STARTING CUSTOM PROGRAM SIMULATION");

    console.log({
      program: config.maxProgramIndex ?? "*",

      weeks: config.maxWeeks ?? "*",

      days: config.maxDays ?? "*",

      simulationMode: config?.simulationMode ?? "realistic",
    });

    console.log("");
  } else {
    console.log("\n🚀 STARTING FULL PROGRAM SIMULATION\n");
  }

  let workoutHistory: CompletedWorkout[] = [];
  let programEvaluations: ProgramEvaluation[] = [];

  const simulationProfile = getSimulationProfile(
    config?.simulationMode ?? "realistic",
  );

  const maxProgramIndex = config?.maxProgramIndex ?? programs.length - 1;

  for (let programIndex = 0; programIndex <= maxProgramIndex; programIndex++) {
    const program = programs[programIndex];

    console.log(`\n==============================`);
    console.log(`🏋️ PROGRAM: ${program.name}`);
    console.log(`==============================\n`);

    const maxWeeks = config?.maxWeeks ?? program.weeks;

    for (let week = 1; week <= maxWeeks; week++) {
      console.log(`\n📅 WEEK ${week}\n`);

      const maxDays = config?.maxDays ?? program.days.length;

      for (
        let dayIndex = 0;
        dayIndex < Math.min(maxDays, program.days.length);
        dayIndex++
      ) {
        program.days[dayIndex].exercises.forEach((exercise, index) => {
          if (!exercise.exerciseId) {
            throw new Error(
              [
                "INVALID PROGRAM EXERCISE",
                `Program: ${program.name}`,
                `Day: ${program.days[dayIndex].title}`,
                `Exercise Index: ${index}`,
                JSON.stringify(exercise, null, 2),
              ].join("\n"),
            );
          }
        });
        const engine = new ProgramEngine(program, dayIndex);

        engine.startWorkout();

        console.log(`\n👉 Day: ${program.days[dayIndex].title}`);

        let exercise = engine.getCurrentExercise();

        let safetyCounter = 0;
        const MAX_ITERATIONS = 1000;

        while (exercise) {
          safetyCounter++;

          if (safetyCounter > MAX_ITERATIONS) {
            console.warn("⚠️ Safety break triggered");
            break;
          }

          console.log(`\n--- Exercise: ${exercise.name} ---`);

          console.log("Starting Config:", JSON.stringify(exercise.config));

          // -----------------------------
          // 🧠 PROGRESSION
          // -----------------------------
          const updatedExercise = getNextExerciseConfig(
            exercise,
            workoutHistory,
          );

          console.log("📊 PROFILE SUMMARY");

          if (updatedExercise.performanceProfile) {
            const p = updatedExercise.performanceProfile;

            console.log({
              avg: Number.isFinite(p.baseline.avgReps)
                ? p.baseline.avgReps
                : p.baseline.avgHold,

              best: Number.isFinite(p.baseline.bestReps)
                ? p.baseline.bestReps
                : p.baseline.bestHold,

              // rangeMin: p.recommendedRange.min,
              // rangeMax: p.recommendedRange.max,

              rangeMin: Number.isFinite(p.recommendedRange.min)
                ? p.recommendedRange.min
                : undefined,

              rangeMax: Number.isFinite(p.recommendedRange.max)
                ? p.recommendedRange.max
                : undefined,

              readiness: p.readinessScore,

              consistency: p.progressionMetrics.consistencyScore,

              fatigue: p.progressionMetrics.fatigueDropoff,

              completion: p.progressionMetrics.completionRate,

              currentBlockWeek: p.currentBlockWeek,

              weeksAtCurrentLevel: p.weeksAtCurrentLevel,

              graduationEligible: p.graduationEligible,

              totalWorkoutHistory: workoutHistory.length,
            });
          }

          // console.log(
          //   "MB Targets:",
          //   JSON.stringify(updatedExercise.matchOrBeatTargets, null, 2),
          // );

          // console.log(
          //   "Updated Config:",
          //   JSON.stringify(updatedExercise.config),
          // );

          // -----------------------------
          // 🎯 SETS
          // -----------------------------
          for (let set = 1; set <= updatedExercise.sets; set++) {
            let completedSet: any = {
              setNumber: set,
            };

            // -----------------------------
            // REPS / TEMPO
            // -----------------------------
            if (
              updatedExercise.type === "reps" ||
              updatedExercise.type === "tempo"
            ) {
              const profileRange =
                updatedExercise.performanceProfile?.recommendedRange;

              const minReps =
                profileRange?.min ?? (updatedExercise.config as any).minReps;

              const maxReps =
                profileRange?.max ?? (updatedExercise.config as any).maxReps;

              const weekBoost = Math.floor(week * 0.5);

              const target = Math.round((minReps + maxReps) / 2) + weekBoost;

              // const variance = rand(-5, 3);
              const variance = rand(
                simulationProfile.repVarianceMin,
                simulationProfile.repVarianceMax,
              );

              completedSet.reps = Math.max(
                minReps,
                Math.min(maxReps + 5, target + variance),
              );
            }
            if (Math.random() < simulationProfile.failureChance) {
              completedSet.reps = Math.max(1, completedSet.reps - rand(2, 5));
            }

            // -----------------------------
            // HOLDS
            // -----------------------------
            if (updatedExercise.type === "hold") {
              const { durationSeconds } = updatedExercise.config as any;

              completedSet.durationSeconds = rand(
                Math.max(5, durationSeconds - 5),
                durationSeconds + 5,
              );
            }

            engine.completeSet(completedSet);
            // temporarily commented out
            // console.log(
            //   `Set ${set}:`,
            //   completedSet.reps ?? completedSet.durationSeconds,
            // );
          }

          // -----------------------------
          // NEXT EXERCISE
          // -----------------------------
          engine.nextExercise();

          exercise = engine.getCurrentExercise();
        }

        const workout = engine.finishWorkout();

        if (workout) {
          (workout as any).feedback = {
            // rating: randomRating(),
            rating: randomRating(
              simulationProfile.ratingMin,
              simulationProfile.ratingMax,
            ),
            tags: randomTags(),
          };

          console.log("\n🧠 Feedback:", (workout as any).feedback);

          workoutHistory.push(workout);
        }

        await sleep(0);
      }

      // ---------------------------------
      // 📈 WEEK SUMMARY
      // ---------------------------------

      console.log("\n📈 WEEK SUMMARY");

      const recentWorkouts = workoutHistory.slice(
        -Math.min(maxDays, program.days.length),
      );

      recentWorkouts.forEach((w) => {
        console.log(`Workout ${w.dayId}: ${w.exercises.length} exercises`);
      });

      // ---------------------------------
      // 🏁 BLOCK COMPLETION
      // Example: every 4 weeks
      // ---------------------------------

      const BLOCK_SIZE = 4;

      if (week % BLOCK_SIZE === 0) {
        console.log("\n🏁 BLOCK COMPLETE");

        // recent block workouts
        const blockWorkoutCount = BLOCK_SIZE * program.days.length;

        const blockHistory = workoutHistory.slice(-blockWorkoutCount);

        // ---------------------------------
        // READINESS
        // ---------------------------------

        const readinessReport = evaluateProgramReadiness(blockHistory);

        console.log("\n📊 READINESS REPORT");

        console.log({
          readinessScore: readinessReport.readinessScore,

          recommendation: readinessReport.recommendation,

          fatigueStability: readinessReport.fatigueStability,

          completionRate: readinessReport.completionRate,

          recoveryScore: readinessReport.recoveryScore,

          painScore: readinessReport.painScore,
        });

        // ---------------------------------
        // SAVE EVALUATION
        // ---------------------------------

        const evaluation: ProgramEvaluation = {
          programId: program.id,

          blockNumber: week / BLOCK_SIZE,

          weekRange: {
            startWeek: week - BLOCK_SIZE + 1,
            endWeek: week,
          },

          readinessReport,

          createdAt: new Date().toISOString(),
        };

        programEvaluations.push(evaluation);

        // ---------------------------------
        // GRADUATION ENGINE
        // ---------------------------------

        const graduationResult = evaluateProgramGraduation(
          programEvaluations.filter((e) => e.programId === program.id),
        );

        console.log("\n🎓 GRADUATION RESULT");

        console.log(graduationResult);
      }
    }
  }

  console.log("\n✅ SIMULATION COMPLETE");
}

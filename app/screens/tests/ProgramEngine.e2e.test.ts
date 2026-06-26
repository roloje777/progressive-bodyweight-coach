//ProgramEngine.e2e.test.ts
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

        recoveryMin: 4,
        recoveryMax: 5,

        painMin: 1,
        painMax: 1,

        difficultyMin: 1,
        difficultyMax: 2,
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
        recoveryMin: 2,
        recoveryMax: 3,

        painMin: 2,
        painMax: 4,

        difficultyMin: 4,
        difficultyMax: 5,
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

        recoveryMin: 3,
        recoveryMax: 4,

        painMin: 1,
        painMax: 2,

        difficultyMin: 3,
        difficultyMax: 4,
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
        recoveryMin: 1,
        recoveryMax: 2,

        painMin: 3,
        painMax: 5,

        difficultyMin: 4,
        difficultyMax: 5,
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

        recoveryMin: 3,
        recoveryMax: 5,

        painMin: 1,
        painMax: 2,

        difficultyMin: 2,
        difficultyMax: 4,
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

  const simulationStats = {
    readinessScores: [] as number[],
    recoveryScores: [] as number[],
    completionRates: [] as number[],
    fatigueScores: [] as number[],
    painScores: [] as number[],

    advanceCount: 0,
    repeatCount: 0,
    deloadCount: 0,

    graduationCount: 0,
  };

  const simulationProfile = getSimulationProfile(
    config?.simulationMode ?? "realistic",
  );

  const maxProgramIndex = config?.maxProgramIndex ?? programs.length - 1;

  for (let programIndex = 0; programIndex <= maxProgramIndex; programIndex++) {
    const program = programs[programIndex];
    const programWorkoutHistory: CompletedWorkout[] = [];

    console.log(`\n==============================`);
    console.log(`🏋️ PROGRAM: ${program.level}`);
    console.log(`==============================\n`);

    const maxWeeks = config?.maxWeeks ?? program.weeks;

    console.log("📆 PROGRAM DURATION", {
      program: program.level,
      configuredWeeks: program.weeks,
      runningWeeks: maxWeeks,
    });

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
                `Program: ${program.level}`,
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

          // 🚨 NAN DETECTOR
          if (updatedExercise.performanceProfile) {
            const p = updatedExercise.performanceProfile;

            const valuesToCheck = {
              avgReps: p.baseline.avgReps,
              bestReps: p.baseline.bestReps,
              lowestReps: p.baseline.lowestReps,

              avgHold: p.baseline.avgHold,
              bestHold: p.baseline.bestHold,
              lowestHold: p.baseline.lowestHold,

              rangeMin: p.recommendedRange.min,
              rangeMax: p.recommendedRange.max,

              consistency: p.progressionMetrics.consistencyScore,
              fatigue: p.progressionMetrics.fatigueDropoff,
              completion: p.progressionMetrics.completionRate,

              readiness: p.readinessScore,
            };

            const invalidEntries = Object.entries(valuesToCheck).filter(
              ([_, value]) =>
                typeof value === "number" && !Number.isFinite(value),
            );

            if (invalidEntries.length > 0) {
              console.error("🚨 NAN PROFILE DETECTED", {
                exercise: updatedExercise.name,
                exerciseId: updatedExercise.id,
                invalidEntries,
                profile: p,
              });
            }
          }

          console.log("📊 PROFILE SUMMARY");

          if (updatedExercise.performanceProfile) {
            const p = updatedExercise.performanceProfile;

            const avgValue = p.baseline.avgHold ?? p.baseline.avgReps ?? 0;

            const bestValue = p.baseline.bestHold ?? p.baseline.bestReps ?? 0;

            console.log({
              avg: avgValue,

              best: bestValue,

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

            // Only apply failure penalty if reps actually exists
            if (
              completedSet.reps !== undefined &&
              Math.random() < simulationProfile.failureChance
            ) {
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
            recoveryRating: randomRating(
              simulationProfile.recoveryMin,
              simulationProfile.recoveryMax,
            ),

            sorenessRating: randomRating(1, 4),

            jointPainRating: randomRating(
              simulationProfile.painMin,
              simulationProfile.painMax,
            ),

            perceivedDifficulty: randomRating(
              simulationProfile.difficultyMin,
              simulationProfile.difficultyMax,
            ),

            tags: randomTags(),
          };

          console.log("\n🧠 Feedback:", (workout as any).feedback);

          workoutHistory.push(workout);
          programWorkoutHistory.push(workout);
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

        const blockHistory = programWorkoutHistory.slice(-blockWorkoutCount);

        // ---------------------------------
        // READINESS
        // ---------------------------------

        const readinessReport = evaluateProgramReadiness(blockHistory);

        simulationStats.readinessScores.push(readinessReport.readinessScore);

        simulationStats.recoveryScores.push(readinessReport.recoveryScore);

        simulationStats.completionRates.push(readinessReport.completionRate);

        simulationStats.fatigueScores.push(readinessReport.fatigueStability);

        simulationStats.painScores.push(readinessReport.painScore);

        // ---------------------------------
        // 📈 BLOCK TREND
        // ---------------------------------

        console.log("📈 BLOCK TREND", {
          program: program.level,
          block: week / BLOCK_SIZE,

          readiness: readinessReport.readinessScore,

          recovery: readinessReport.recoveryScore,

          fatigue: readinessReport.fatigueStability,

          pain: readinessReport.painScore,

          recommendation: readinessReport.recommendation,
        });

        console.log("\n📊 READINESS REPORT");

        switch (readinessReport.recommendation) {
          case "advance":
            simulationStats.advanceCount++;
            break;

          case "repeat":
            simulationStats.repeatCount++;
            break;

          case "deload":
            simulationStats.deloadCount++;
            break;
        }

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

        console.log("📚 PROGRAM EVALUATIONS", {
          program: program.level,
          evaluations: programEvaluations
            .filter((e) => e.programId === program.id)
            .map((e) => ({
              block: e.blockNumber,
              readiness: e.readinessReport.readinessScore,
              recommendation: e.readinessReport.recommendation,
            })),
        });

        const graduationResult = evaluateProgramGraduation(
          programEvaluations.filter((e) => e.programId === program.id),
        );
        // if (graduationResult.graduate) {
        //   simulationStats.graduationCount++;
        // }

        console.log("\n🎓 GRADUATION RESULT");

        console.log(graduationResult);

        // ---------------------------------
        // PROGRAM COMPLETE
        // ---------------------------------

        if (graduationResult.graduate) {
          simulationStats.graduationCount++;

          console.log(
            `\n✅ Graduated from ${program.level} after Block ${week / BLOCK_SIZE}`,
          );

          break; // exits the week loop and starts the next program
        }
      }
    }
  }

  const avg = (values: number[]) =>
    values.length
      ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
      : 0;

  const maxReadiness =
    simulationStats.readinessScores.length > 0
      ? Math.max(...simulationStats.readinessScores)
      : 0;

  const minReadiness =
    simulationStats.readinessScores.length > 0
      ? Math.min(...simulationStats.readinessScores)
      : 0;

  const firstReadiness = simulationStats.readinessScores[0] ?? 0;

  const lastReadiness =
    simulationStats.readinessScores[
      simulationStats.readinessScores.length - 1
    ] ?? 0;

  const readinessGain = lastReadiness - firstReadiness;

  console.log("\n📊 SIMULATION SUMMARY");

  console.log({
    mode: config?.simulationMode ?? "realistic",

    avgReadiness: avg(simulationStats.readinessScores),

    maxReadiness,
    minReadiness,
    firstReadiness,
    lastReadiness,
    readinessGain,

    avgRecovery: avg(simulationStats.recoveryScores),

    avgCompletion: avg(simulationStats.completionRates),

    avgFatigue: avg(simulationStats.fatigueScores),

    avgPain: avg(simulationStats.painScores),

    advanceRecommendations: simulationStats.advanceCount,

    repeatRecommendations: simulationStats.repeatCount,

    deloadRecommendations: simulationStats.deloadCount,

    graduations: simulationStats.graduationCount,
  });

  console.log("\n✅ SIMULATION COMPLETE");
}

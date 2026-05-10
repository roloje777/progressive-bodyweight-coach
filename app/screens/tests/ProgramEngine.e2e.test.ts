import { programs } from "@/data/programs";
import { ProgramEngine } from "@/engine/ProgramEngine";
import { getNextExerciseConfig } from "@/engine/ProgressEngine";
import { CompletedWorkout } from "@/models/WorkoutLog";

type SimulationConfig = {
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

function randomRating() {
  return rand(2, 5); // bias slightly away from constant failure
}

function randomTags() {
  const tags: string[] = [];
  if (Math.random() < 0.2) tags.push("Form broke down");
  return tags;
}

// -----------------------------
// 💤 YIELD TO UI THREAD
// -----------------------------

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------------
// 🧪 SIMULATION
// -----------------------------
export async function runProgramE2ETest(
  config?: SimulationConfig
) {
  console.log("🚀 STARTING FULL PROGRAM SIMULATION\n");

  let workoutHistory: CompletedWorkout[] = [];

  const maxProgramIndex =
    config?.maxProgramIndex ?? programs.length - 1;

  for (
    let programIndex = 0;
    programIndex <= maxProgramIndex;
    programIndex++
  ) {
    const program = programs[programIndex];

    console.log(`\n==============================`);
    console.log(`🏋️ PROGRAM: ${program.name}`);
    console.log(`==============================\n`);

    const maxWeeks =
      config?.maxWeeks ?? program.weeks;

    for (let week = 1; week <= maxWeeks; week++) {
      console.log(`\n📅 WEEK ${week}\n`);

      const maxDays =
        config?.maxDays ?? program.days.length;

      for (
        let dayIndex = 0;
        dayIndex < Math.min(maxDays, program.days.length);
        dayIndex++
      ) {
        const engine = new ProgramEngine(
          program,
          dayIndex
        );

        engine.startWorkout();

        console.log(
          `\n👉 Day: ${program.days[dayIndex].title}`
        );

        let exercise = engine.getCurrentExercise();

        let safetyCounter = 0;
        const MAX_ITERATIONS = 1000;

        while (exercise) {
          safetyCounter++;

          if (safetyCounter > MAX_ITERATIONS) {
            console.warn(
              "⚠️ Safety break triggered"
            );
            break;
          }

          console.log(
            `\n--- Exercise: ${exercise.name} ---`
          );

          console.log(
            "Starting Config:",
            JSON.stringify(exercise.config)
          );

          // -----------------------------
          // 🧠 PROGRESSION
          // -----------------------------
          const updatedExercise =
            getNextExerciseConfig(
              exercise,
              workoutHistory
            );

          console.log(
            "Updated Config:",
            JSON.stringify(updatedExercise.config)
          );

          // -----------------------------
          // 🎯 SETS
          // -----------------------------
          for (
            let set = 1;
            set <= updatedExercise.sets;
            set++
          ) {
            let completedSet: any = {
              setNumber: set,
            };

            if (
              updatedExercise.type === "reps" ||
              updatedExercise.type === "tempo"
            ) {
              const { minReps, maxReps } =
                updatedExercise.config as any;

              completedSet.reps = rand(
                minReps,
                maxReps
              );
            }

            if (
              updatedExercise.type === "hold"
            ) {
              const { durationSeconds } =
                updatedExercise.config as any;

              completedSet.durationSeconds =
                rand(
                  Math.max(
                    5,
                    durationSeconds - 5
                  ),
                  durationSeconds + 5
                );
            }

            engine.completeSet(completedSet);

            console.log(
              `Set ${set}:`,
              completedSet.reps ??
                completedSet.durationSeconds
            );
          }

          engine.nextExercise();

          exercise =
            engine.getCurrentExercise();
        }

        // -----------------------------
        // 🧠 FEEDBACK
        // -----------------------------
        const workout =
          engine.finishWorkout();

        if (workout) {
          (workout as any).feedback = {
            rating: randomRating(),
            tags: randomTags(),
          };

          console.log(
            "\n🧠 Feedback:",
            (workout as any).feedback
          );

          workoutHistory.push(workout);
        }

        await sleep(0);
      }
    }
  }

  console.log("\n✅ SIMULATION COMPLETE");
}
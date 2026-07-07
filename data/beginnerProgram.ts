import { Program } from "../models/Program";

export const beginnerProgram: Program = {
  id: "level1",

  name: "BODYWEIGHT HYPERTROPHY COACH",

  description: "Progressive • Science-Backed • No Weights Required",

  goals: "Learn tension, build joint strength, establish volume tolerance",

  level: "Level 1 - Foundation",

  restBetweenSets: 75,

  restBetweenExercises: 150,

  autoStartRest: true,

  getReadyCountdownSeconds: 5,

  countdownAlertThreshold: 5,

  playRestSound: true,

  weeks: 4,

  days: [
    {
      id: "day1-push",

      title: "Day 1 - Push (Chest / Shoulders / Triceps)",

      exercises: [
        {
          exerciseId: "incline-push-ups",

          sets: 4,

          config: {
            minReps: 10,
            maxReps: 15,
          },
        },

        {
          exerciseId: "standard-push-ups",

          sets: 3,

          config: {
            minReps: 12,
            maxReps: 20,
          },
        },

        {
          exerciseId: "pike-push-ups",

          sets: 3,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "bench-dips",

          sets: 3,

          config: {
            minReps: 12,
            maxReps: 15,
          },
        },
      ],
    },

    {
      id: "day2-lower",

      title: "Day 2 - Lower Body (quadriceps (front of thighs) / glutes (buttocks) / hamstrings (back of thighs) /  calves)",

      exercises: [
        {
          exerciseId: "body-weight-squats-slow",

          sets: 4,

          config: {
            startPhase: "eccentric",

            eccentric: 3,

            pauseEccentric: 1,

            concentric: 3,

            pauseConcentric: 1,

            minReps: 15,

            maxReps: 30,
          },
        },

        {
          exerciseId: "reverse-lunges",

          sets: 3,

          config: {
            minReps: 10,
            maxReps: 15,
          },
        },

        {
          exerciseId: "hip-thrusts",

          sets: 3,

          config: {
            minReps: 15,
            maxReps: 25,
          },
        },

        {
          exerciseId: "standing-calf-raises-slow",

          sets: 4,

          config: {
            startPhase: "concentric",

            eccentric: 3,

            pauseEccentric: 1,

            concentric: 3,

            pauseConcentric: 1,

            minReps: 10,

            maxReps: 30,
          },
        },
      ],
    },

    {
      id: "day3-Pull",

      title: "Day 3 - Pull ( Latissimus dorsi (lats) / Biceps (brachii and brachialis) /  Trapezius, atissimus dorsi, and rhomboids ",

      exercises: [
        {
          exerciseId: "inverted-rows-bent-knees",

          sets: 4,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "towel-curls",

          sets: 3,

          config: {
            durationSeconds: 20,
          },
        },

        {
          exerciseId: "scapular-pulls",

          sets: 3,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },
      ],
    },

    {
      id: "day4-full-core",

      title: "Day 4 - Full / Core",

      exercises: [
        {
          exerciseId: "push-ups-slow-negatives",

          sets: 3,

          config: {
            startPhase: "eccentric",

            eccentric: 4,

            pauseEccentric: 2,

            concentric: 2,

            pauseConcentric: 2,

            minReps: 8,

            maxReps: 15,
          },
        },

        {
          exerciseId: "hollow-body-hold",

          sets: 3,

          config: {
            durationSeconds: 30,
          },
        },

        {
          exerciseId: "plank",

          sets: 3,

          config: {
            durationSeconds: 45,
          },
        },
      ],
    },
  ],
};
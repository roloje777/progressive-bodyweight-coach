import { Program } from "../models/Program";

export const growthProgram: Program = {
  id: "level2",

  name: "BODYWEIGHT HYPERTROPHY COACH",

  description: "Progressive • Science-Backed • No Weights Required",

  goals: "Mechanical tension + unilateral overload",

  level: "Level 2 - Growth",

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

      title: "Day 1 - Push",

      exercises: [
        {
          exerciseId: "decline-push-ups",

          sets: 4,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "pseudo-planche-push-ups",

          sets: 3,

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          exerciseId: "elevated-pike-push-ups",

          sets: 4,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "diamond-push-ups",

          sets: 3,

          config: {
            minReps: 10,
            maxReps: 15,
          },
        },
      ],
    },

    {
      id: "day2-pull",

      title: "Day 2 - Pull",

      exercises: [
        {
          exerciseId: "inverted-rows-straight-legs",

          sets: 4,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "chin-ups",

          sets: 4,

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          exerciseId: "towel-curls",

          sets: 3,

          config: {
            durationSeconds: 25,
          },
        },
      ],
    },

    {
      id: "day3-legs",

      title: "Day 3 - Legs",

      exercises: [
        {
          exerciseId: "bulgarian-split-squats",

          sets: 4,

          sideMode: "alternating",

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "tempo-squats",

          sets: 4,

          config: {
            startPhase: "eccentric",

            eccentric: 4,

            pauseEccentric: 1,

            concentric: 2,

            pauseConcentric: 1,

            minReps: 12,

            maxReps: 15,
          },
        },

        {
          exerciseId: "single-leg-hip-thrusts",

          sets: 3,

          sideMode: "alternating",

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "single-leg-calf-raises",

          sets: 4,

          sideMode: "alternating",

          config: {
            minReps: 8,
            maxReps: 15,
          },
        },
      ],
    },

    {
      id: "day4-upper-volume",

      title: "Day 4 - Volume Day",

      exercises: [
        {
          exerciseId: "push-ups",

          sets: 4,

          config: {
            minReps: 12,
            maxReps: 20,
          },
        },

        {
          exerciseId: "inverted-rows",

          sets: 4,

          config: {
            minReps: 10,
            maxReps: 15,
          },
        },

        {
          exerciseId: "pike-holds",

          sets: 3,

          config: {
            durationSeconds: 30,
          },
        },

        {
          exerciseId: "walking-lunges",

          sets: 4,

          config: {
            minReps: 20,
            maxReps: 20,
          },
        },

        {
          exerciseId: "wall-sit",

          sets: 3,

          config: {
            durationSeconds: 45,
          },
        },
      ],
    },
  ],
};
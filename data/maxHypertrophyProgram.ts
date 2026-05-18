import { Program } from "../models/Program";

export const maxProgram: Program = {
  id: "level3",
  name: "BODYWEIGHT HYPERTROPHY COACH",
  description: "Progressive • Science-Backed • No Weights Required",
  goals: "High tension, long eccentrics, advanced leverage",
  level: "Level 3 - Max Hypertrophy",

  restBetweenSets: 10,
  restBetweenExercises: 15,
  autoStartRest: true,

  getReadyCountdownSeconds: 3,
  countdownAlertThreshold: 6,
  playRestSound: true,

  weeks: 4,

  days: [
    {
      id: "day1-push",
      title: "Day 1 - Push",

      exercises: [
        {
          id: "archer-push-ups",
          description: "Wide grip / load one arm at a time",
          sets: 4,

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          id: "deep-push-ups",
          description: "Go as deep as possible",
          sets: 4,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          id: "handstand-push-up",
          description: "Use the wall for support",
          sets: 4,

          config: {
            minReps: 5,
            maxReps: 8,
          },
        },

        {
          id: "triceps-extensions",
          description: "Use rings or a chair",
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
          id: "pull-ups",
          description: "Use a wide grip",
          sets: 5,

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          id: "archer-rows",
          description: "Load one side at a time",
          sets: 4,

          config: {
            minReps: 8,
            maxReps: 8,
          },
        },

        {
          id: "ring-bicep-curls",
          description: "",
          sets: 3,

          config: {
            minReps: 10,
            maxReps: 15,
          },
        },

        {
          id: "dead-hangs",
          description: "Isometric",
          sets: 2,

          config: {
            durationSeconds: 45,
          },
        },
      ],
    },

    {
      id: "day3-legs",
      title: "Day 3 - Legs",

      exercises: [
        {
          id: "pistol-negatives",
          description:
            "Use a chair as support if needed • Alternate legs each set",

          sets: 5,
          sideMode: "alternating",

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          id: "bulgarian-split-squats",
          description:
            "Alternate legs each set • Slow 3s down | 3s up",

          sets: 4,
          sideMode: "alternating",

          config: {
            startPhase: "eccentric",

            eccentric: 3,
            pauseEccentric: 1,

            concentric: 3,
            pauseConcentric: 1,

            minReps: 10,
            maxReps: 10,
          },
        },

        {
          id: "nordic-hamstring-negatives",
          description:
            "Slow negatives • down 5s • push up with arms",

          sets: 3,

          config: {
            startPhase: "eccentric",

            eccentric: 5,
            pauseEccentric: 1,

            concentric: 2,
            pauseConcentric: 1,

            minReps: 10,
            maxReps: 10,
          },
        },

        {
          id: "dead-hangs",
          description: "Hold on",

          sets: 2,

          config: {
            durationSeconds: 60,
          },
        },
      ],
    },

    {
      id: "day4-upper",
      title: "Day 4 - Upper",

      exercises: [
        {
          id: "ring-push-up",
          description: "Go as deep as possible",

          sets: 3,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          id: "inverted-rows",
          description: "Straight legs • elevated feet",

          sets: 3,

          config: {
            minReps: 15,
            maxReps: 15,
          },
        },

        {
          id: "dead-hangs",
          description: "Inverted row hold at mid position",

          sets: 3,

          config: {
            durationSeconds: 30,
          },
        },
      ],
    },

    {
      id: "day5-lower",
      title: "Day 5 - Lower",

      exercises: [
        {
          id: "walking-lunges",
          description: "Reps each leg",

          sets: 4,

          config: {
            minReps: 20,
            maxReps: 20,
          },
        },

        {
          id: "step-ups",
          description: "Controlled per leg",

          sets: 3,
          sideMode: "alternating",

          config: {
            minReps: 12,
            maxReps: 12,
          },
        },

        {
          id: "wall-sit",
          description: "Isometric",

          sets: 3,

          config: {
            durationSeconds: 60,
          },
        },

        {
          id: "hip-thrusts",
          description: "Hold contraction for 4 seconds",

          sets: 3,

          config: {
            startPhase: "concentric",

            eccentric: 2,
            pauseEccentric: 1,

            concentric: 2,
            pauseConcentric: 4,

            minReps: 12,
            maxReps: 15,
          },
        },

        {
          id: "standing-calf-raises-slow",
          description:
            "Slow • up 3s | hold 1s | down 3s | hold 1s",

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
  ],
};
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
          exerciseId: "archer-push-ups",
        
          sets: 4,

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          exerciseId: "deep-push-ups",
         
          sets: 4,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "handstand-push-up",
        
          sets: 4,

          config: {
            minReps: 5,
            maxReps: 8,
          },
        },

        {
          exerciseId: "triceps-extensions",
        
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
          exerciseId: "pull-ups",
       
          sets: 5,

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          exerciseId: "archer-rows",
         
          sets: 4,

          config: {
            minReps: 8,
            maxReps: 8,
          },
        },

        {
          exerciseId: "ring-bicep-curls",
         
          sets: 3,

          config: {
            minReps: 10,
            maxReps: 15,
          },
        },

        {
          exerciseId: "dead-hangs",
          
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
         exerciseId: "pistol-negatives",
         

          sets: 5,
          sideMode: "alternating",

          config: {
            minReps: 6,
            maxReps: 10,
          },
        },

        {
          exerciseId: "bulgarian-split-squats",
         

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
         exerciseId: "nordic-hamstring-negatives",
         

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
          exerciseId: "dead-hangs",
         

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
          exerciseId: "ring-push-up",
       

          sets: 3,

          config: {
            minReps: 8,
            maxReps: 12,
          },
        },

        {
          exerciseId: "inverted-rows",
         

          sets: 3,

          config: {
            minReps: 15,
            maxReps: 15,
          },
        },

        {
         exerciseId: "dead-hangs",
         

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
         exerciseId: "walking-lunges",
         

          sets: 4,

          config: {
            minReps: 20,
            maxReps: 20,
          },
        },

        {
          exerciseId: "step-ups",
          description: "Controlled per leg",

          sets: 3,
         

          config: {
            minReps: 12,
            maxReps: 12,
          },
        },

        {
          exerciseId: "wall-sit",
         

          sets: 3,

          config: {
            durationSeconds: 60,
          },
        },

        {
         exerciseId: "hip-thrusts",
         

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
  ],
};
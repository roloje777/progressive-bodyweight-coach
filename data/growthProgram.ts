import { maybeAddSuffix } from "react-native-reanimated/lib/typescript/common";
import { Program } from "../models/Program";

export const growthProgram: Program = {
  id: "level2",
  name: "BODYWEIGHT HYPERTROPHY SYSTEM",
  description: "Progressive • Science-Backed • No Weights Required",
  goals: "Mechanical tension + unilateral overload",
  level: "Level 2 - Growth", // programs level
  restBetweenSets: 10,
  restBetweenExercises: 15,
  autoStartRest: true,
  getReadyCountdownSeconds: 5, // default 5
  countdownAlertThreshold: 5,
  playRestSound: true, // default true
  weeks: 4, // program duration
  days: [
    // {
    //   id: "day1-push",
    //   title: "Day 1 - Push",
    //   exercises: [
    //     {
          
    //       id: "decline-push-ups",
    //       name: "Decline Push-ups",
    //       type: "reps",
    //       sets: 4,
    //       config: { minReps: 8, maxReps: 12 },
    //     },
    //       {
          
    //       id: "pseudo-planche-push-ups",
    //       name: "Pseudo Planche Push-Ups",
    //       type: "reps",
    //       sets: 3,
    //       config: { minReps: 6, maxReps: 10 },
    //     },
    //       {
          
    //       id: "elevated-pike-push-ups",
    //       name: "Elevated Pike Pushups",
    //       type: "reps",
    //       sets: 4,
    //       config: { minReps: 8, maxReps: 12 },
    //     },
    //         {
          
    //       id: "diamond-push-ups",
    //       name: "Diamond Push-ups",
    //       type: "reps",
    //       sets: 3,
    //       config: { minReps: 10, maxReps: 15},
    //         }
    //   ],
    // },
     {
      id: "day2-pull",
      title: "Day 2 - Pull",
      exercises: [
        {
          
          id: "inverted-rows-bent-legs",
          name: "Inverted Rows (Straight Legs)",
          type: "reps",
          sets: 4,
          config: { minReps: 8, maxReps: 12 },
        },
          {
          
          id: "chin-ups",
          name: "Chin-Ups (Assisted if needed)",
          type: "reps",
          sets: 4,
          config: { minReps: 6, maxReps: 10 },
        },
          {
          
          id: "towel-curls",
          name: "Towel Curls",
          type: "hold",
          sets: 3,
           config: { durationSeconds: 25 },
        },
      ],
    },
       {
      id: "day3-legs",
      title: "Day 3 - Legs",
      exercises: [
        {
          
          id: "bulgarian-split-squats",
          name: "Bulgarian Split Squats",
          type: "reps",
          sets: 4,
          config: { minReps: 8, maxReps: 12 },
        },
          {
          
          id: "tempo-squats",
          name: "Tempo Squats (4 secs down)",
          type: "tempo",
          sets: 4,
             config: { startPhase: "eccentric",
                    eccentric: 4,
                    pauseEccentric: 1,
                    concentric: 1,
                    pauseConcentric: 1,
                    minReps: 12,
                    maxReps:15
                  },
        },
          {
          
          id: "single-leg-hip-thrusts",
          name: "single-leg Hip Thrusts",
          type: "reps",
          sets: 3,
           config: { minReps:8, maxReps: 12},
        },
          {
          
          id: "single-leg-calf-raises-left",
          name: "Single Leg Calf Raises (Left)",
          type: "reps",
          sets: 4,
           config: { minReps:8, maxReps: 15},
        },
           {
          
          id: "single-leg-calf-raises-right",
          name: "Single Leg Calf Raises (right)",
          type: "reps",
          sets: 4,
           config: { minReps:8, maxReps: 15},
        },
      ],
    },
           {
      id: "day4-upper-volume",
      title: "Day 3 -Volume Day",
      exercises: [
        {
          
          id: "push-ups",
          name: "Push-Ups",
          type: "reps",
          sets: 4,
          config: { minReps: 12, maxReps: 20},
        },
          {
          
          id: "inverted-rows",
          name: "Inverted Rows",
          type: "reps",
          sets: 4,
             config: { minReps: 10, maxReps: 15},
        },
          {
          
          id: "pike-holds",
          name: "Pike Holds",
          type: "hold",
          sets: 3,
           config: { durationSeconds: 30 },
        },
          {
          
          id: "walking-lunges",
          name: "Walking Lunges",
          type: "reps",
          sets: 4,
           config: { minReps:20, maxReps: 20},
        },
           {
          
          id: "wall-sit",
          name: "Wall Sit",
          type: "hold",
          sets: 3,
           config: { durationSeconds: 45 },
        },
      ],
    },
  ],
};

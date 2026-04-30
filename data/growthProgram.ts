import { maybeAddSuffix } from "react-native-reanimated/lib/typescript/common";
import { Program } from "../models/Program";

export const growthProgram: Program = {
  id: "level2",
  name: "BODYWEIGHT HYPERTROPHY COACH",
  description: "Progressive • Science-Backed • No Weights Required",
  goals: "Mechanical tension + unilateral overload",
  level: "Level 2 - Growth", // programs level
  restBetweenSets: 75,
  restBetweenExercises: 150,
  autoStartRest: true,
  getReadyCountdownSeconds: 5, // default 5
  countdownAlertThreshold: 5,
  playRestSound: true, // default true
  weeks: 4, // program duration
  days: [
    {
      id: "day1-push",
      title: "Day 1 - Push",
      exercises: [
        {
          
          id: "decline-push-ups",
          name: "Decline Push-ups",
           description: "Elevated - feet on a bench or chair",
          type: "reps",
          sets: 4,
          config: { minReps: 8, maxReps: 12 },
        },
          {
          
          id: "pseudo-planche-push-ups",
          name: "Pseudo Planche Push-Ups",
           description: "",
          type: "reps",
          sets: 3,
          config: { minReps: 6, maxReps: 10 },
        },
          {
          
          id: "elevated-pike-push-ups",
          name: "Elevated Pike Pushups",
           description: "Elevated - feet on a bench or chair",
          type: "reps",
          sets: 4,
          config: { minReps: 8, maxReps: 12 },
        },
            {
          
          id: "diamond-push-ups",
          name: "Diamond Push-ups",
           description: "",
          type: "reps",
          sets: 3,
          config: { minReps: 10, maxReps: 15},
            }
      ],
    },
     {
      id: "day2-pull",
      title: "Day 2 - Pull",
      exercises: [
        {
          
          id: "inverted-rows-straight-legs",
          name: "Inverted Rows ",
          description: "Straight Legs",
          type: "reps",
          sets: 4,
          config: { minReps: 8, maxReps: 12 },
        },
          {
          
          id: "chin-ups",
          name: "Chin-Ups",
          description: "Assisted if needed",
          type: "reps",
          sets: 4,
          config: { minReps: 6, maxReps: 10 },
        },
          {
          
          id: "towel-curls",
          name: "Towel Curls",
          description: "Isometric",
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
          description:"Alternate legs each set",
          type: "reps",
          sets: 4,
          sideMode: "alternating",
          config: { minReps: 8, maxReps: 12 },
        },
          {
          
          id: "tempo-squats",
          name: "Tempo Squats",
            description:"down 4s | hold 1s | up 2s | hold 1s",
          type: "tempo",
          sets: 4,
             config: { startPhase: "eccentric",
                    eccentric: 4,
                    pauseEccentric: 1,
                    concentric: 2,
                    pauseConcentric: 1,
                    minReps: 12,
                    maxReps:15
                  },
        },
          {
          
          id: "single-leg-hip-thrusts",
          name: "single-leg Hip Thrusts",
          description:"Alternate legs each set",
          type: "reps",
          sideMode: "alternating",
          sets: 3,
           config: { minReps:8, maxReps: 12},
        },
      
          {
          
          id: "single-leg-calf-raises",
          name: "Single Leg Calf Raises",
          description:"Alternate legs each set",
          type: "reps",
          sets: 4,
          sideMode: "alternating",
           config: { minReps:8, maxReps: 15},
        },
           
      ],
    },
           {
      id: "day4-upper-volume",
      title: "Day 4 -Volume Day",
      exercises: [
        {
          
          id: "push-ups",
          name: "Push-Ups",
          description:"Standard",
          type: "reps",
          sets: 4,
          config: { minReps: 12, maxReps: 20},
        },
          {
          
          id: "inverted-rows",
          name: "Inverted Rows",
          description:"",
          type: "reps",
          sets: 4,
             config: { minReps: 10, maxReps: 15},
        },
          {
          
          id: "pike-holds",
          name: "Pike Holds",
          description:"",
          type: "hold",
          sets: 3,
           config: { durationSeconds: 30 },
        },
          {
          
          id: "walking-lunges",
          name: "Walking Lunges",
          description:"reps on each leg",
          type: "reps",
          sets: 4,
           config: { minReps:20, maxReps: 20},
        },
           {
          
          id: "wall-sit",
          name: "Wall Sit",
          description:"Isometric",
          type: "hold",
          sets: 3,
           config: { durationSeconds: 45 },
        },
      ],
    },
  ],
};

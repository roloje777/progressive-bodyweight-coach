import { Program } from "../models/Program";

export const maxProgram: Program = {
  id: "level3",
  name: "BODYWEIGHT HYPERTROPHY SYSTEM", // the program App Name
  description: "Progressive • Science-Backed • No Weights Required", // app subtitle / description
  goals: "High tension, long eccentrics, advanced leverage", // program goals
  level: "Level 3 - Max Hypertrophy", // programs level
  restBetweenSets: 10,
  restBetweenExercises: 15,
  autoStartRest: true,
  getReadyCountdownSeconds: 3, // default 5
  countdownAlertThreshold: 6,
  playRestSound: true, // default true
  weeks: 4, // program duration
  days: [
    {
      id: "day1-push",
      title: "Day 1 - Push",
      exercises: [
        {
          id: "archer-push-ups",
          name: "Archer Push-Ups",
          description: "Wide grip / load one arm at a time",
          type: "reps",
          sets: 4,
          config: { minReps: 6, maxReps: 10 },
        },
        {
          id: "deep-push-ups",
          name: "Ring Push-Ups / Deep Push-Ups",
          description: "Go as deep as possible",
          type: "reps",
          sets: 4,
          config: { minReps: 8, maxReps: 12 },
        },
        {
          id: "handstand-push-up",
          name: "Handstand Push-Up",
          description: "Use the wall for support",
          type: "reps",
          sets: 4,
          config: { minReps: 5, maxReps: 8 },
        },
        {
          id: "triceps-extensions",
          name: "Triceps Extensions",
          description: "Use Rings or a chair",
          type: "reps",
          sets: 3,
          config: { minReps: 10, maxReps: 15 },
        },
      ],
    },
    {
      id: "day2-pull",
      title: "Day 2 - Pull",
      exercises: [
        {
          id: "pull-ups",
          name: "Pull-ups",
          description: "Use a wide grip",
          type: "reps",
          sets: 5,
          config: { minReps: 6, maxReps: 10 },
        },
        {
          id: "archer-rows",
          name: "Archer Rows",
          description: "Load one side at a time",
          type: "reps",
          sets: 4,
          config: { minReps: 8, maxReps: 8 },
        },
        {
          id: "ring-bicep-curls",
          name: "Ring Bicep Curls",
          description: "",
          type: "reps",
          sets: 3,
          config: { minReps: 10, maxReps: 15 },
        },
        {
          id: "dead-hangs",
          name: "Dead Hangs",
          description: "Isometric",
          type: "hold",
          sets: 2,
          config: { durationSeconds: 45 },
        },
      ],
    },
    {
      id: "day3-legs",
      title: "Day 3 - Legs",
      exercises: [
        {
          id: "pistol-negatives",
          name: "Negative Pistol Squats",
          description: "Use a chair as support if you need it",
          type: "reps",
          sets: 5,
          config: { minReps: 6, maxReps: 10 },
        },
        {
          id: "bulgarian-split-squats",
          name: "Bulgarian Split Squat",
          description: "Slow - 3s down | 3s up",
          type: "tempo",
          sets: 4,
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
          name: "Nordic Hamstring Negatives",
          description: "slow negatives - down 5s | push yourself up with arms",
          type: "tempo",
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
          name: "Dead Hangs",
          description: "Hold on",
          type: "hold",
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
          name: "Ring Push-Up",
          description: "Go as deep as possible",
          type: "reps",
          sets: 3,
          config: { minReps: 8, maxReps: 12 },
        },

        {
          id: "inverted-rows",
          name: "Inverted Rows",
          description: "Straight Legs - low body to elevated feet",
          type: "reps",
          sets: 3,
          config: { minReps: 15, maxReps: 15 },
        },
        
        {
          id: "dead-hangs",
          name: "Inverted Row Holds",
          description: "At Mid Position hold",
          type: "hold",
          sets: 3,
          config: { durationSeconds: 30 },
        },
      ],
    },
    {
      id: "day5-lower",
      title: "Day 5 - Lower",
      exercises: [
        {
          id: "walking_lunges",
          name: "Walking Lunges",
          description: "reps each leg",
          type: "reps",
          sets: 4,
          config: { minReps: 20, maxReps: 20 },
        },
        {
          id: "step-ups",
          name: "Step-Ups",
          description: "Controlled per leg",
          type: "reps",
          sets: 3,
          config: { minReps: 12, maxReps: 12 },
        },
        {
          id: "wall-sit",
          name: "Wall Sit",
          description: "Isometric",
          type: "hold",
          sets: 3,
          config: { durationSeconds: 60 },
        },
        {
          id: "hip-thrusts",
          name: "Hip Thrusts",
          description: "Hold contraction for 4 seconds",
          type: "tempo",
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
          name: "Slow Standing Calf Raises",
          description: "slow - up 3s | hold 2s | down 3s | hold 2s",
          type: "tempo",
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

import { Program } from "../models/Program";

export const beginnerProgram: Program = {
  id: "level1",
  name: "BODYWEIGHT HYPERTROPHY SYSTEM", 
  description: "Progressive • Science-Backed • No Weights Required",
  goals:"Learn tension, build joint strength, establish volume tolerance",
  level:"Level 1 - Foundation",
  restBetweenSets: 75, // default 75
  restBetweenExercises: 150, // default 150
  autoStartRest: true,
  getReadyCountdownSeconds: 5, 
  countdownAlertThreshold: 5,
  playRestSound: true, // default true
  weeks: 4,
  days: [
    
 
    {
      id: "day1-push",
      title: "Day 1 - Push (Chest / Shoulders / Triceps)",
      exercises: [
        {
          id: "incline-pushups",
          name:"Incline Push-Ups",
           description: "",
          type: "reps",
          sets: 4,
          config:{minReps: 10, maxReps: 15},
        },
        {
          id: "standard-push-ups",
          name: "Standard Push-Ups",
           description: "",
          type: "reps",
          sets: 3,
          config: { minReps: 12, maxReps: 20 },
        },
          {

          id: "pike-push-ups",
          name: "Pike Push-Ups",
           description: "",
          type: "reps",
          sets: 3,
          config: { minReps: 8, maxReps: 12 },
        },
          {

          id: "bench-dips",
          name: "Bench Dips",
           description: "",
          type: "reps",
          sets: 3,
          config: { minReps: 12, maxReps: 15 },
        },

      ],
    },
    {
      id: "day2-lower",
      title: "Day 2 - Lower Body",
      exercises: [

          {
          id: "body-weight-squats-slow",
          name: "Slow Body Weight Squats",
           description: "",
          type: "tempo",
          sets: 4,
          config: { startPhase: "eccentric",
                    eccentric: 3,
                    pauseEccentric: 1,
                    concentric: 3,
                    pauseConcentric: 1,
                    minReps: 15,
                    maxReps:30
                  },
        },
        {
          id: "reverse-lunges",
          name: "Reverse Lunges",
           description: "",
          type: "reps",
          sets: 3,
          config: { minReps: 10, maxReps: 15 },
        },
        {
          id: "hip-thrusts",
          name: "Hip Thrusts",
           description: "",
          type: "reps",
          sets: 3,
            config: { minReps: 15, maxReps: 25 },
        },
        {
          id: "standing-calf-raises-slow",
          name: "Standing Calf Raises",
           description: "slow - up 3s | hold 1s | down 3s | hold 1s",
          type: "tempo",
          sets: 4,
            config: { startPhase: "concentric",
                    eccentric: 3,
                    pauseEccentric: 1,
                    concentric: 3,
                    pauseConcentric: 1,
                    minReps: 10,
                    maxReps:30
                  },
        },
   
      ],
    },
     {
      id: "day4-lower",
      title: "Day 3 - Pull",
      exercises: [

        {
          id: "inverted-rows-bent-knees",
          name: "Inverted Rows",
           description: "Bent knees",
          type: "reps",
          sets: 4,
            config: { minReps: 8, maxReps: 12 },
        },
        {
          id: "towel-curls",
          name: "Towel Curls",
           description: "Isometric",
          type: "hold",
          sets: 3,
             config: { durationSeconds: 20 },
        },
        {
          id: "scapular-pulls",
          name: "Scapular Pulls",
           description: "",
          type: "reps",
          sets: 3,
            config: { minReps: 8, maxReps: 12 },
        },
      ],
    },
    {
      id: "day5-full-core",
      title: "Day 4 - Full / Core",
      exercises: [
          {
          id: "push-ups-slow-negatives",
          name: "Push-Ups",
           description: "Slow negatives",
          type: "tempo",
          sets: 3,
                 config: { startPhase: "eccentric",
                    eccentric: 3,
                    pauseEccentric: 1,
                    concentric: 1,
                    pauseConcentric: 1,
                    minReps: 8,
                    maxReps:15
                  },
        },

        {
          id: "hollow-body-hold",
          name: "Hollow Body Hold",
           description: "",
          type: "hold",
          sets: 3,
          config: { durationSeconds: 30 },
        },
        {
          id: "plank",
          name: "Plank",
           description: "",
          type: "hold",
          sets: 3,
          config: { durationSeconds: 45 },
        },
      ],
    },
   
  ]
};

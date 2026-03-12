  import { Program } from "../models/Program";

  export const beginnerProgram: Program = {
    id: "level1-beginner",
    name: "Level 1 - Beginner",
    description: "12-week progressive hypertrophy program for beginners.",
    level: "Beginner",
    restBetweenSets: 10, 
    restBetweenExercises: 15,
    autoStartRest: true,
    getReadyCountdownSeconds: 3, // default 3
    playRestSound: true, // default true
    days: [ 
      // {
      //   id: "day1-push",
      //   title: "Day 1 - Push (Chest / Shoulders / Triceps)",
      //   exercises: [
      //     {
      //       id: "incline-pushups",
      //       name:"Incline Push-Ups",
      //       type: "reps",
      //       sets: 4,
      //       config:{minReps: 10, maxReps: 15},
      //     },              
      //     {
      //       id: "standard-pushups",
      //       name: "Standard Push-Ups",
      //       type: "reps",
      //       sets: 3,
      //       config: { minReps: 12, maxReps: 20 },
      //     }, 
      //       {

      //       id: "pike-pushups",
      //       name: "Pike Push-Ups",
      //       type: "reps",
      //       sets: 3,
      //       config: { minReps: 8, maxReps: 12 },
      //     }, 
      //       {

      //       id: "bench-dips",
      //       name: "Bench Dips",
      //       type: "reps",
      //       sets: 3,
      //       config: { minReps: 12, maxReps: 15 },
      //     }, 
          
                
      //   ],
      // },
      {
        id: "day2-lower",
        title: "Day 2 - Lower Body",
        exercises: [   
          
            {
            id: "body-weight-squats-slow",
            name: "Slow Body Weight Squats",
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
            type: "reps",
            sets: 3,
            config: { minReps: 10, maxReps: 15 },
          },
          {
            id: "hip-thrusts",
            name: "Hip Thrusts",
            type: "reps",
            sets: 3,
              config: { minReps: 15, maxReps: 25 },
          },
          {
            id: "standing-calf-raises-slow",
            name: "Slow Standing Calf Raises",
            type: "tempo",
            sets: 4,
              config: { startPhase: "eccentric",
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
        id: "day3-rest",
        title: "Day 3 - Rest",
        exercises: [],
      },
      {
        id: "day4-lower",
        title: "Day 4 - Lower Body",
        exercises: [
        
          {
            id: "reverse-lunges",
            name: "Reverse Lunges",
            type: "reps",
            sets: 3,
              config: { minReps: 10, maxReps: 15 },
          },
          {
            id: "hip-thrusts",
            name: "Hip Thrusts",
            type: "reps",
            sets: 3,
              config: { minReps: 10, maxReps: 15 },
          },
          {
            id: "standing-calf-raises",
            name: "Standing Calf Raises",
            type: "reps",
            sets: 4,
              config: { minReps: 15, maxReps: 25 },
          },
        ],
      },
      {
        id: "day5-full-core",
        title: "Day 5 - Full / Core",
        exercises: [
        
          {
            id: "hollow-body-hold",
            name: "Hollow Body Hold",
            type: "hold",
            sets: 3,
            config: { durationSeconds: 30 },
          },
          {
            id: "plank",
            name: "Plank",
            type: "hold",
            sets: 3,
            config: { durationSeconds: 45 },
          },
        ],
      },
      {
        id: "day6-cardio",
        title: "Day 6 - Cardio / Optional HIIT (20 min)",
        exercises: [
          {
            id: "cardio",
            name: "Cardio (20 min)",
            type: "reps",
            sets: 1,
            config: { minReps: 1, maxReps: 1 },
          },
          {
            id: "hiit",
            name: "HIIT Training (20 min)",
            type: "reps",
            sets: 1,
              config: { minReps: 1, maxReps: 1 },
          },
        ],
      },
      {
        id: "day7-rest",
        title: "Day 7 - Rest",
        exercises: [],
      },
    ],
  };

import { Program } from  "../models/Program";


export const beginnerProgram: Program = {
  id: "level1-beginner",
  name: "Level 1 - Beginner",
  description: "12-week progressive hypertrophy program for beginners.",
  level: "Beginner",
  days: [
    {
      id: "day1-push",
      title: "Day 1 - Push (Chest / Shoulders / Triceps)",
      exercises: [
        { id: "incline-pushups", name: "Incline Push-Ups", type: "reps", sets: 4, config: { reps: 12 } },
        { id: "standard-pushups", name: "Standard Push-Ups", type: "reps", sets: 3, config: { reps: 16 } },
        { id: "pike-pushups", name: "Pike Push-Ups", type: "reps", sets: 3, config: { reps: 10 } },
        { id: "bench-dips", name: "Bench Dips", type: "reps", sets: 3, config: { reps: 14 } },
      ],
    },
    {
      id: "day2-lower",
      title: "Day 2 - Lower Body",
      exercises: [
        { id: "bodyweight-squats", name: "Bodyweight Squats (slow)", type: "tempo", sets: 4, config: { eccentric: 2.5, pauseBottom: 0, concentric: 2.5, pauseTop: 0, reps: 20 } },
        { id: "reverse-lunges", name: "Reverse Lunges", type: "reps", sets: 3, config: { reps: 10 } },
        { id: "hip-thrusts", name: "Hip Thrusts", type: "reps", sets: 3, config: { reps: 15 } },
        { id: "standing-calf-raises", name: "Standing Calf Raises", type: "reps", sets: 4, config: { reps: 20 } },
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
        { id: "bodyweight-squats", name: "Bodyweight Squats (slow)", type: "tempo", sets: 4, config: { eccentric: 2.5, pauseBottom: 0, concentric: 2.5, pauseTop: 0, reps: 20 } },
        { id: "reverse-lunges", name: "Reverse Lunges", type: "reps", sets: 3, config: { reps: 10 } },
        { id: "hip-thrusts", name: "Hip Thrusts", type: "reps", sets: 3, config: { reps: 15 } },
        { id: "standing-calf-raises", name: "Standing Calf Raises", type: "reps", sets: 4, config: { reps: 20 } },
      ],
    },
    {
      id: "day5-full-core",
      title: "Day 5 - Full / Core",
      exercises: [
        { id: "pushups-slow-negatives", name: "Push-Ups (slow negatives)", type: "tempo", sets: 3, config: { eccentric: 2.5, pauseBottom: 0, concentric: 0, pauseTop: 0, reps: 10 } },
        { id: "hollow-body-hold", name: "Hollow Body Hold", type: "hold", sets: 3, config: { durationSeconds: 30 } },
        { id: "plank", name: "Plank", type: "hold", sets: 3, config: { durationSeconds: 45 } },
      ],
    },
    {
      id: "day6-cardio",
      title: "Day 6 - Cardio / Optional HIIT (20 min)",
      exercises: [
        { id: "cardio", name: "Cardio (20 min)", type: "reps", sets: 1, config: { reps: 1 } },
        { id: "hiit", name: "HIIT Training (20 min)", type: "reps", sets: 1, config: { reps: 1 } },
      ],
    },
    {
      id: "day7-rest",
      title: "Day 7 - Rest",
      exercises: [],
    },
  ],
};
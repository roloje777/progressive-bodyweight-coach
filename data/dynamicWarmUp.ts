import { WarmUpRoutine } from "../models/warmUp.ts";

export const dynamicWarmUp: WarmUpRoutine = {
  title: "Dynamic Stretching Routine",
  type: "warmup",
  exercises: [
    {
      id: "jumping_jacks",
      name: "Jumping Jacks",
      type: "time",
      config: {
        durationSeconds: 30,
      },
    },
    {
      id: "walking_lunges",
      name: "Walking Lunges",
      type: "reps",
      config: {
        reps: 20,
        perSide: true,
      },
    },
    {
      id: "knee_tucks",
      name: "Knee Tucks",
      type: "reps",
      config: {
        reps: 20,
        perSide: true,
      },
    },
    {
      id: "leg_swings",
      name: "Leg Swings",
      type: "reps",
      config: {
        reps: 20,
        perSide: true,
      },
    },
    {
      id: "side_lunges",
      name: "Side Lunges",
      type: "reps",
      config: {
        reps: 20,
        perSide: true,
      },
    },
    {
      id: "butt_kicks",
      name: "Butt Kicks",
      type: "reps",
      config: {
        reps: 20,
        perSide: true,
      },
    },
    {
      id: "arm_circles_normal_clockwise",
      name: "Normal Arm Circles (Clockwise)",
      type: "reps",
      config: {
        reps: 10,
      },
    },
    {
      id: "arm_circles_normal_counter",
      name: "Normal Arm Circles (Counter Clockwise)",
      type: "reps",
      config: {
        reps: 10,
      },
    },
    {
      id: "arm_circles_large_clockwise",
      name: "Large Arm Circles (Clockwise)",
      type: "reps",
      config: {
        reps: 10,
      },
    },
    {
      id: "arm_circles_large_counter",
      name: "Large Arm Circles (Counter Clockwise)",
      type: "reps",
      config: {
        reps: 10,
      },
    },
    {
      id: "pushups",
      name: "Push-Ups",
      type: "reps",
      config: {
        reps: 10,
      },
    },
  ],
};
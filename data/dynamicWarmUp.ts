import { WarmUpRoutine } from "../models/warmUp";

export const dynamicWarmUp: WarmUpRoutine = {
  title: "Dynamic Stretching Routine",
  type: "warmup",

  exercises: [
    {
      exerciseId: "jumping-jacks",
      config: {
        durationSeconds: 30,
      },
    },

    {
      exerciseId: "walking-lunges",
      config: {
        reps: 20,
        perSide: true,
      },
    },

    {
      exerciseId: "standing-knee-tucks",
      config: {
        reps: 20,
        perSide: true,
      },
    },

    {
      exerciseId: "leg-swings",
      config: {
        reps: 20,
        perSide: true,
      },
    },

    {
      exerciseId: "side-lunges",
      config: {
        reps: 10,
        perSide: true,
      },
    },

    {
      exerciseId: "butt-kicks",
      config: {
        reps: 20,
        perSide: true,
      },
    },

    {
      exerciseId: "arm-circles-normal-clockwise",
      config: {
        reps: 10,
      },
    },

    {
      exerciseId: "arm-circles-normal-counter",
      config: {
        reps: 10,
      },
    },

    {
      exerciseId: "arm-circles-large-clockwise",
      config: {
        reps: 5,
      },
    },

    {
      exerciseId: "arm-circles-large-counter",
      config: {
        reps: 5,
      },
    },

    {
      exerciseId: "standard-push-ups",
      config: {
        reps: 10,
      },
    },
  ],
};
import { StretchRoutine } from "../models/stretchRoutine";

export const staticStretches: StretchRoutine = {
  title: "Static Stretching Routine",
  type: "time",

  exercises: [
    {
      exerciseId: "seated-back-twist",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },

    {
      exerciseId: "quad-stretch",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },

    {
      exerciseId: "hip-abductor-stretch",
      config: {
        durationSeconds: 15,
        perSide: false,
      },
    },

    {
      exerciseId: "standing-forward-bend",
      config: {
        durationSeconds: 15,
        perSide: false,
      },
    },

    {
      exerciseId: "lat-stretches",
      config: {
        durationSeconds: 15,
        perSide: false,
      },
    },

    {
      exerciseId: "glute-stretches",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },

    {
      exerciseId: "calf-stretches",
      config: {
        durationSeconds: 15,
        perSide: false,
      },
    },

    {
      exerciseId: "lying-abdominal-stretches",
      config: {
        durationSeconds: 15,
        perSide: false,
      },
    },

    {
      exerciseId: "neck-side-bend",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },

    {
      exerciseId: "shoulder-stretch",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },

    {
      exerciseId: "triceps-stretch",
      config: {
        durationSeconds: 15,
        perSide: true,
      },
    },
  ],
};
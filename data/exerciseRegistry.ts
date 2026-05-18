import { ExerciseDefinition } from "../models/Exercise";

export const exerciseRegistry: Record<string, ExerciseDefinition> = {
  // =========================
  // WARMUP / MOBILITY
  // =========================

  "jumping-jacks": {
    id: "jumping-jacks",
    name: "Jumping Jacks",
    type: "time",
    family: "warmup",
    guideId: "jumping-jacks",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "standing-knee-tucks": {
    id: "standing-knee-tucks",
    name: "Standing Knee Tucks",
    type: "reps",
    family: "warmup",
    guideId: "standing-knee-tucks",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "leg-swings": {
    id: "leg-swings",
    name: "Leg Swings",
    type: "reps",
    family: "mobility",
    guideId: "leg-swings",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "side-lunges": {
    id: "side-lunges",
    name: "Side Lunges",
    type: "reps",
    family: "mobility",
    guideId: "side-lunges",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "butt-kicks": {
    id: "butt-kicks",
    name: "Butt Kicks",
    type: "reps",
    family: "warmup",
    guideId: "butt-kicks",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "arm-circles-normal-clockwise": {
    id: "arm-circles-normal-clockwise",
    name: "Normal Arm Circles (Clockwise)",
    type: "reps",
    family: "mobility",
    guideId: "arm-circles-normal-clockwise",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "arm-circles-normal-counter": {
    id: "arm-circles-normal-counter",
    name: "Normal Arm Circles (Counter Clockwise)",
    type: "reps",
    family: "mobility",
    guideId: "arm-circles-normal-counter",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "arm-circles-large-clockwise": {
    id: "arm-circles-large-clockwise",
    name: "Large Arm Circles (Clockwise)",
    type: "reps",
    family: "mobility",
    guideId: "arm-circles-large-clockwise",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "arm-circles-large-counter": {
    id: "arm-circles-large-counter",
    name: "Large Arm Circles (Counter Clockwise)",
    type: "reps",
    family: "mobility",
    guideId: "arm-circles-large-counter",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  // =========================
  // STATIC STRETCHES
  // =========================

  "seated-back-twist": {
    id: "seated-back-twist",
    name: "Seated Back Twist",
    type: "time",
    family: "stretch",
    guideId: "seated-back-twist",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "quad-stretch": {
    id: "quad-stretch",
    name: "Quad Stretch",
    type: "time",
    family: "stretch",
    guideId: "quad-stretch",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "hip-abductor-stretch": {
    id: "hip-abductor-stretch",
    name: "Hip Abductor Stretch",
    type: "time",
    family: "stretch",
    guideId: "hip-abductor-stretch",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "standing-forward-bend": {
    id: "standing-forward-bend",
    name: "Standing Forward Bend",
    type: "time",
    family: "stretch",
    guideId: "standing-forward-bend",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "lat-stretches": {
    id: "lat-stretches",
    name: "Lat Stretches",
    type: "time",
    family: "stretch",
    guideId: "lat-stretches",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "glute-stretches": {
    id: "glute-stretches",
    name: "Glute Stretches",
    type: "time",
    family: "stretch",
    guideId: "glute-stretches",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "calf-stretches": {
    id: "calf-stretches",
    name: "Calf Stretches",
    type: "time",
    family: "stretch",
    guideId: "calf-stretches",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "lying-abdominal-stretches": {
    id: "lying-abdominal-stretches",
    name: "Lying Abdominal Stretches",
    type: "time",
    family: "stretch",
    guideId: "lying-abdominal-stretches",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "neck-side-bend": {
    id: "neck-side-bend",
    name: "Neck Side Bend",
    type: "time",
    family: "stretch",
    guideId: "neck-side-bend",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "shoulder-stretch": {
    id: "shoulder-stretch",
    name: "Shoulder Stretch",
    type: "time",
    family: "stretch",
    guideId: "shoulder-stretch",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "triceps-stretch": {
    id: "triceps-stretch",
    name: "Triceps Stretch",
    type: "time",
    family: "stretch",
    guideId: "triceps-stretch",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  // =========================
  // LEVEL 1 — FOUNDATION
  // =========================

  "incline-push-ups": {
    id: "incline-push-ups",
    name: "Incline Push-Ups",
    type: "reps",
    family: "push",
    guideId: "incline-pushups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "standard-push-ups": {
    id: "standard-push-ups",
    name: "Standard Push-Ups",
    type: "reps",
    family: "push",
    guideId: "standard-pushups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "pike-push-ups": {
    id: "pike-push-ups",
    name: "Pike Push-Ups",
    type: "reps",
    family: "push",
    guideId: "pike-pushups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "bench-dips": {
    id: "bench-dips",
    name: "Bench Dips",
    type: "reps",
    family: "push",
    guideId: "bench-dips",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "body-weight-squats-slow": {
    id: "body-weight-squats-slow",
    name: "Slow Body Weight Squats",
    type: "tempo",
    family: "squat",
    guideId: "body-weight-squats-slow",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "reverse-lunges": {
    id: "reverse-lunges",
    name: "Reverse Lunges",
    type: "reps",
    family: "lunge",
    guideId: "reverse-lunges",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "hip-thrusts": {
    id: "hip-thrusts",
    name: "Hip Thrusts",
    type: "reps",
    family: "hinge",
    guideId: "hip-thrusts",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "standing-calf-raises-slow": {
    id: "standing-calf-raises-slow",
    name: "Standing Calf Raises",
    type: "tempo",
    family: "calves",
    guideId: "standing-calf-raises-slow",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "inverted-rows-bent-knees": {
    id: "inverted-rows-bent-knees",
    name: "Inverted Rows",
    type: "reps",
    family: "row",
    guideId: "inverted-rows-bent-knees",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "towel-curls": {
    id: "towel-curls",
    name: "Towel Curls",
    type: "hold",
    family: "biceps",
    guideId: "towel-curls",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "scapular-pulls": {
    id: "scapular-pulls",
    name: "Scapular Pulls",
    type: "reps",
    family: "pull",
    guideId: "scapular-pulls",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "push-ups-slow-negatives": {
    id: "push-ups-slow-negatives",
    name: "Push-Ups",
    type: "tempo",
    family: "push",
    guideId: "push-ups-slow-negatives",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "hollow-body-hold": {
    id: "hollow-body-hold",
    name: "Hollow Body Hold",
    type: "hold",
    family: "core",
    guideId: "hollow-body-hold",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  plank: {
    id: "plank",
    name: "Plank",
    type: "hold",
    family: "core",
    guideId: "plank",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  // =========================
  // LEVEL 2 — GROWTH
  // =========================

  "decline-push-ups": {
    id: "decline-push-ups",
    name: "Decline Push-Ups",
    type: "reps",
    family: "push",
    guideId: "decline-push-ups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "pseudo-planche-push-ups": {
    id: "pseudo-planche-push-ups",
    name: "Pseudo Planche Push-Ups",
    type: "reps",
    family: "push",
    guideId: "pseudo-planche-push-ups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "elevated-pike-push-ups": {
    id: "elevated-pike-push-ups",
    name: "Elevated Pike Push-Ups",
    type: "reps",
    family: "push",
    guideId: "elevated-pike-push-ups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "diamond-push-ups": {
    id: "diamond-push-ups",
    name: "Diamond Push-Ups",
    type: "reps",
    family: "push",
    guideId: "diamond-push-ups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "inverted-rows-straight-legs": {
    id: "inverted-rows-straight-legs",
    name: "Inverted Rows",
    type: "reps",
    family: "row",
    guideId: "inverted-rows-straight-legs",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "chin-ups": {
    id: "chin-ups",
    name: "Chin-Ups",
    type: "reps",
    family: "pull",
    guideId: "chin-ups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "bulgarian-split-squats": {
    id: "bulgarian-split-squats",
    name: "Bulgarian Split Squats",
    type: "reps",
    family: "single-leg",
    guideId: "bulgarian-split-squats",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "tempo-squats": {
    id: "tempo-squats",
    name: "Tempo Squats",
    type: "tempo",
    family: "squat",
    guideId: "tempo-squats",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "single-leg-hip-thrusts": {
    id: "single-leg-hip-thrusts",
    name: "Single Leg Hip Thrusts",
    type: "reps",
    family: "hinge",
    guideId: "single-leg-hip-thrusts",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "single-leg-calf-raises": {
    id: "single-leg-calf-raises",
    name: "Single Leg Calf Raises",
    type: "reps",
    family: "calves",
    guideId: "single-leg-calf-raises",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "push-ups": {
    id: "push-ups",
    name: "Push-Ups",
    type: "reps",
    family: "push",
    guideId: "push-ups",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "inverted-rows": {
    id: "inverted-rows",
    name: "Inverted Rows",
    type: "reps",
    family: "row",
    guideId: "inverted-rows",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "pike-holds": {
    id: "pike-holds",
    name: "Pike Holds",
    type: "hold",
    family: "shoulders",
    guideId: "pike-holds",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "walking-lunges": {
    id: "walking-lunges",
    name: "Walking Lunges",
    type: "reps",
    family: "lunge",
    guideId: "walking-lunges",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "wall-sit": {
    id: "wall-sit",
    name: "Wall Sit",
    type: "hold",
    family: "legs",
    guideId: "wall-sit",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  // =========================
  // LEVEL 3 — MAX HYPERTROPHY
  // =========================

  "archer-push-ups": {
    id: "archer-push-ups",
    name: "Archer Push-Ups",
    type: "reps",
    family: "push",
    guideId: "archer-push-ups",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "deep-push-ups": {
    id: "deep-push-ups",
    name: "Ring Push-Ups / Deep Push-Ups",
    type: "reps",
    family: "push",
    guideId: "deep-push-ups",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "handstand-push-up": {
    id: "handstand-push-up",
    name: "Handstand Push-Up",
    type: "reps",
    family: "vertical-push",
    guideId: "handstand-push-up",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "triceps-extensions": {
    id: "triceps-extensions",
    name: "Triceps Extensions",
    type: "reps",
    family: "push",
    guideId: "triceps-extensions",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "pull-ups": {
    id: "pull-ups",
    name: "Pull-Ups",
    type: "reps",
    family: "pull",
    guideId: "pull-ups",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "archer-rows": {
    id: "archer-rows",
    name: "Archer Rows",
    type: "reps",
    family: "row",
    guideId: "archer-rows",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "ring-bicep-curls": {
    id: "ring-bicep-curls",
    name: "Ring Bicep Curls",
    type: "reps",
    family: "biceps",
    guideId: "ring-bicep-curls",

    adaptive: {
      progressionStyle: "volume",
    },
  },

  "dead-hangs": {
    id: "dead-hangs",
    name: "Dead Hangs",
    type: "hold",
    family: "grip",
    guideId: "dead-hangs",

    adaptive: {
      progressionStyle: "duration",
    },
  },

  "pistol-negatives": {
    id: "pistol-negatives",
    name: "Negative Pistol Squats",
    type: "reps",
    family: "single-leg",
    guideId: "pistol-negatives",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "nordic-hamstring-negatives": {
    id: "nordic-hamstring-negatives",
    name: "Nordic Hamstring Negatives",
    type: "tempo",
    family: "hinge",
    guideId: "nordic-hamstring-negatives",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "ring-push-up": {
    id: "ring-push-up",
    name: "Ring Push-Up",
    type: "reps",
    family: "push",
    guideId: "ring-push-up",

    adaptive: {
      progressionStyle: "intensity",
    },
  },

  "step-ups": {
    id: "step-ups",
    name: "Step-Ups",
    type: "reps",
    family: "single-leg",
    guideId: "step-ups",

    adaptive: {
      progressionStyle: "volume",
    },
  },
};
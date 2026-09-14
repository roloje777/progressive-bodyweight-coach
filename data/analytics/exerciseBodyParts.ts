export type AnalyticsBodyPart =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Core"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Grip";

const FAMILY_BODY_PARTS: Record<string, AnalyticsBodyPart[]> = {
  push: ["Chest", "Shoulders", "Triceps"],
  "vertical-push": ["Shoulders", "Triceps"],
  row: ["Back", "Biceps"],
  pull: ["Back", "Biceps"],
  biceps: ["Biceps"],
  core: ["Core"],
  squat: ["Quads", "Glutes"],
  lunge: ["Quads", "Glutes"],
  "single-leg": ["Quads", "Glutes"],
  hinge: ["Hamstrings", "Glutes"],
  calves: ["Calves"],
  shoulders: ["Shoulders"],
  grip: ["Grip"],
};

/**
 * Small exercise-specific overrides for movements where the broad registry
 * family would otherwise overstate the body-part exposure.
 */
const EXERCISE_BODY_PART_OVERRIDES: Record<string, AnalyticsBodyPart[]> = {
  "pike-push-ups": ["Shoulders", "Triceps"],
  "elevated-pike-push-ups": ["Shoulders", "Triceps"],
  "handstand-push-up": ["Shoulders", "Triceps"],
  "pike-holds": ["Shoulders"],
  "triceps-extensions": ["Triceps"],
  "ring-triceps-extensions": ["Triceps"],
  "diamond-push-ups": ["Triceps", "Chest"],
  "close-grip-push-ups": ["Triceps", "Chest"],
  "scapular-pulls": ["Back"],
  "reverse-snow-angels": ["Back", "Shoulders"],
  "ring-face-pulls": ["Back", "Shoulders"],
  "dead-hangs": ["Grip", "Back"],
  "towel-curls": ["Biceps", "Grip"],
  "wall-sit": ["Quads", "Glutes"],
  "nordic-hamstring-negatives": ["Hamstrings", "Glutes"],
  "hamstring-walkouts": ["Hamstrings", "Glutes"],
};

export function getAnalyticsBodyPartsForExercise(args: {
  exerciseId: string;
  family?: string;
}): AnalyticsBodyPart[] {
  const override = EXERCISE_BODY_PART_OVERRIDES[args.exerciseId];
  if (override) return override;
  return args.family ? FAMILY_BODY_PARTS[args.family] ?? [] : [];
}

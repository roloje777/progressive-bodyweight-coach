import type { AnalyticsBodyPart } from "@/data/analytics/exerciseBodyParts";

export type WeeklyTrainingLoadPoint = {
  weekStart: string;
  workouts: number;
  workingSets: number;
  reps: number;
  holdSeconds: number;
  timeUnderTensionSeconds: number;
};

export type BodyPartExerciseLoadPoint = {
  exerciseId: string;
  setExposures: number;
  sessions: number;
  sharePercent: number;
};

export type BodyPartLoadPoint = {
  bodyPart: AnalyticsBodyPart;
  setExposures: number;
  sessions: number;
  exerciseCount: number;
  sharePercent: number;
  exercises: BodyPartExerciseLoadPoint[];
};

export type TrainingLoadDetailAnalytics = {
  workoutsCompleted: number;
  workingSetsCompleted: number;
  totalRepsCompleted: number;
  totalHoldSeconds: number;
  totalTimeUnderTensionSeconds: number;
  averageSetsPerWorkout: number | null;
  averageTimeUnderTensionPerWorkoutSeconds: number | null;
  weekly: WeeklyTrainingLoadPoint[];
  bodyParts: BodyPartLoadPoint[];
  totalBodyPartSetExposures: number;
  unmappedWorkingSets: number;
};

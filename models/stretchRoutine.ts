export type StretchExerciseType = "time";

export interface StretchConfig {
  durationSeconds: number;
  perSide?: boolean;
}

export interface StretchExercise {
  exerciseId: string;
  config: StretchConfig;
}

export interface StretchRoutine {
  title: string;
  type: "time";
  exercises: StretchExercise[];
}
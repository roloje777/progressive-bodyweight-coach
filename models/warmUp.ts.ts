export type WarmUpExerciseType = "reps" | "time";

export interface WarmUpRepConfig {
  reps: number;
  perSide?: boolean;
}

export interface WarmUpTimeConfig {
  durationSeconds: number;
}

export interface WarmUpExercise {
  id: string;
  name: string;
  type: WarmUpExerciseType;
  config: WarmUpRepConfig | WarmUpTimeConfig;
}

export interface WarmUpRoutine {
  title: string;
  type: "warmup";
  exercises: WarmUpExercise[];
}
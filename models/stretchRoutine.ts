export type StretchExerciseType = "time";

export interface StretchConfig {
    durationSeconds: number;
   perSide?: boolean;
}


export interface StretchExercise {
  id: string;
  name: string;
  type: StretchExerciseType;
  config: StretchConfig ;
}

export interface StretchRoutine {
  title: string;
  type: "time";
  exercises: StretchExercise[];
}
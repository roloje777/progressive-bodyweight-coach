export type CompletedSet = {
  setNumber: number;
  repsCompleted?: number;
  durationSeconds?: number;
  weightUsed?: number;
  rpe?: number;
};

export type CompletedExercise = {
  exerciseId: string;
  sets: CompletedSet[];
};

export type CompletedWorkout = {
  programId: string;
  dayId: string;
  date: string;
  exercises: CompletedExercise[];
};
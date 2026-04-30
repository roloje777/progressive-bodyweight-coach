export type CompletedSet = {
  setNumber: number;
  reps?: number | { left: number; right: number };
  durationSeconds?: number;
    durationLeft?: number;   // ✅ REQUIRED
  durationRight?: number;  // ✅ REQUIRED
  phaseDurations?: number[];

  // optional normalized fields (recommended)
  repsCompleted?: number;
  repsLeft?: number;
  repsRight?: number;
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
export interface WorkoutFeedback {
  recoveryRating: number;

  sorenessRating: number;

  jointPainRating: number;

  perceivedDifficulty: number;

  tags?: string[];
}

export type CompletedSet = {
  setNumber: number;

  reps?: number | { left: number; right: number };

  durationSeconds?: number;

  durationLeft?: number;

  durationRight?: number;

  phaseDurations?: number[];

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

  // 🆕 NEW
  feedback?: WorkoutFeedback;
};
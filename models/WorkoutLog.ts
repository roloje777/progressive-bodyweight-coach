// export interface WorkoutFeedback {
//   recoveryRating: number;

//   sorenessRating: number;

//   jointPainRating: number;

//   perceivedDifficulty: number;

//   tags?: string[];
// }

export interface WorkoutFeedback {
  rating: number;

  tags?: string[];

  comment?: string;
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

  completedAt: string;

  startWorkoutTime: number;
  endWorkoutTime: number;

  workoutDuration: number;
  timeUnderTension: number;

  exercises: CompletedExercise[];

  feedback?: WorkoutFeedback;
};
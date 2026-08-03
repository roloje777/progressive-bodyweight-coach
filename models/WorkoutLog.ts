//models/WorkoutLog.ts
import { WorkoutStatus, ItemStatus } from "./WorkoutStatus";

export interface WorkoutFeedback {
  rating: number;

  tags?: string[];

  comment?: string;
}

export type CompletedSet = {
  setNumber: number;

  status: ItemStatus;

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


export type CompletedSession = {
  programId: string;
  dayId: string;

  status?: WorkoutStatus;

  completedAt: string;

   
  startWorkoutTime: number;
  endWorkoutTime: number;

  workoutDuration: number;
  timeUnderTension: number;

  exercises: CompletedExercise[];

  feedback?: WorkoutFeedback;
};
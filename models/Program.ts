import { Exercise } from "./Exercise";

export interface WorkoutDay {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  days: WorkoutDay[];

  // new optional config
  restBetweenSets?: number; // seconds
  restBetweenExercises?: number; // seconds
  autoStartRest?: boolean; // whether rest timers auto-start
  getReadyCountdownSeconds?: number; // get ready for exercise
  playRestSound?: boolean; // default true
}

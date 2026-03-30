import { Exercise } from "./Exercise";

export interface WorkoutDay {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string; // the program App Name
  description: string; // app subtitle / description
  level:
    | "Level 1 - Foundation"
    | "Level 2 - Growth"
    | "Level 3 - Max Hypertrophy"; // the different levels of the three programs
  goals: string; // program goals
  days: WorkoutDay[];
  weeks: number; // new numof weeks each program runs for
  // new optional config
  restBetweenSets?: number; // seconds
  restBetweenExercises?: number; // seconds
  autoStartRest?: boolean; // whether rest timers auto-start
  getReadyCountdownSeconds?: number; // logic
  countdownAlertThreshold?: number; // UX trigger
  playRestSound?: boolean; // user preference
  enableVibration?: boolean;
}

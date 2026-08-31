//models/Program.ts
import { ProgramExercise } from "./Exercise";

export interface WorkoutDay {
  id: string;
  title: string;
  exercises: ProgramExercise[];
}

export type ProgramProgressionMode = "finite" | "maintenance";

export type RecommendedTrainingCycleSlot =
  | {
      type: "training";
      dayIndex: number;
    }
  | {
      type: "rest";
    };

export interface RecommendedTrainingCycle {
  slots: RecommendedTrainingCycleSlot[];
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
  weeks: number; // new number of weeks each program runs for

  /**
   * Advisory training/rest relationship for one complete program cycle.
   *
   * This is not a calendar schedule. The user may complete the cycle over
   * any number of calendar days. The TrainingScheduleEngine compares these
   * recommendations with actual completed-session timestamps.
   */
  recommendedCycle: RecommendedTrainingCycle;

  /**
   * finite:
   *   progresses toward another configured program.
   *
   * maintenance:
   *   open-ended / highest-current pathway.
   */
  progressionMode?: ProgramProgressionMode;
  // new optional config
  restBetweenSets?: number; // seconds
  restBetweenExercises?: number; // seconds
  autoStartRest?: boolean; // whether rest timers auto-start
  getReadyCountdownSeconds?: number; // logic
  countdownAlertThreshold?: number; // UX trigger
  playRestSound?: boolean; // user preference
  enableVibration?: boolean;
}

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
}
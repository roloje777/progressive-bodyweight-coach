import { Program, WorkoutDay } from "../models/Program";
import {
  CompletedSet,
  CompletedWorkout,
  CompletedExercise,
} from "../models/WorkoutLog";

export class ProgramEngine {
  private program: Program;
  private day: WorkoutDay;
  private currentExerciseIndex = 0;

  // Holds the current workout log
  private workoutLog: CompletedWorkout | null = null;

  constructor(program: Program, dayIndex: number = 0) {
    this.program = program;
    this.day = program.days[dayIndex];
  }

  // Start a workout for this day
  startWorkout() {
    this.currentExerciseIndex = 0;
    this.workoutLog = {
      programId: this.program.id,
      dayId: this.day.id,
      date: new Date().toISOString(),
      exercises: [],
    };
  }

  // Log a completed set for the current exercise
  completeSet(set: CompletedSet) {
    if (!this.workoutLog) return;

    const exercise = this.getCurrentExercise();
    if (!exercise) return;

    // Find existing exercise log or create it
    let exerciseLog = this.workoutLog.exercises.find(
      (e) => e.exerciseId === exercise.id,
    );

    if (!exerciseLog) {
      exerciseLog = {
        exerciseId: exercise.id,
        sets: [],
      };
      this.workoutLog.exercises.push(exerciseLog);
    }

    // Add set
    exerciseLog.sets.push(set);
  }

  getCurrentExercise() {
    return this.day.exercises[this.currentExerciseIndex];
  }

  hasNextExercise(): boolean {
    return this.currentExerciseIndex < this.day.exercises.length - 1;
  }

  nextExercise() {
    if (this.hasNextExercise()) {
      this.currentExerciseIndex++;
    }
  }

finishWorkout(): CompletedWorkout | null {
  return this.workoutLog;
}
}

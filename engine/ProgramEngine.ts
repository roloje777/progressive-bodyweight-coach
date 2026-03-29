import { Program, WorkoutDay } from "../models/Program";
import {
  CompletedSet,
  CompletedWorkout,
  CompletedExercise,
} from "../models/WorkoutLog";
import { Exercise } from "../models/Exercise";
import { assert } from "@/utils/assert";

export class ProgramEngine {
  private program: Program;
  private day: WorkoutDay;
  private currentExerciseIndex = 0;

  // Holds the current workout log
  private workoutLog: CompletedWorkout | null = null;

  constructor(program: Program, dayIndex: number = 0) {
    assert(program, "Program is undefined in ProgramEngine");
    assert(program.days, "Program days missing in ProgramEngine");
    assert(
      program.days[dayIndex],
      `Invalid dayIndex ${dayIndex} in ProgramEngine for program ${program.name}`,
    );
    this.program = program;
    this.day = program.days[dayIndex];

    console.log("\n=== ENGINE INIT ===");
    console.log("Program:", program.name);
    console.log("Day Index:", dayIndex);
    console.log("Day Title:", this.day?.title);

    this.day?.exercises?.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.name}`);
    });
    console.log("====================\n");
  }

  public getProgram(): Program {
    return this.program;
  }

  public getDay() {
    return this.day;
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
    if (this.isCurrentExerciseComplete()) return;

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
    const exercise = this.day.exercises[this.currentExerciseIndex];
    console.log("getCurrentExercise():", exercise?.name);
    return exercise;
  }

  hasNextExercise(): boolean {
    return this.currentExerciseIndex < this.day.exercises.length - 1;
  }

  nextExercise() {
    console.log("ProgramEngine.nextExercise() called");
    console.log("Current index BEFORE:", this.currentExerciseIndex);

    if (this.hasNextExercise()) {
      this.currentExerciseIndex++;
    }

    console.log("Current index AFTER:", this.currentExerciseIndex);
  }

  finishWorkout(): CompletedWorkout | null {
    return this.workoutLog;
  }

  getCompletedSetCount(): number {
    if (!this.workoutLog) return 0;

    const exercise = this.getCurrentExercise();
    if (!exercise) return 0;

    const exerciseLog = this.workoutLog.exercises.find(
      (e) => e.exerciseId === exercise.id,
    );

    return exerciseLog ? exerciseLog.sets.length : 0;
  }

  isCurrentExerciseComplete(): boolean {
    const exercise = this.getCurrentExercise();
    if (!exercise) return false;

    return this.getCompletedSetCount() >= exercise.sets;
  }

  public getNextExercise(): Exercise | null {
    if (!this.hasNextExercise()) return null;
    return this.day.exercises[this.currentExerciseIndex + 1];
  }
}

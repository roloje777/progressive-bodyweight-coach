import { Program, WorkoutDay } from "../models/Program";
import {
  CompletedSet,
  CompletedWorkout,
} from "../models/WorkoutLog";
import { Exercise } from "../models/Exercise";
import { assert } from "@/utils/assert";

export class ProgramEngine {
  private program: Program;
  private day: WorkoutDay;
  private currentExerciseIndex = 0;

  private workoutLog: CompletedWorkout | null = null;

  constructor(program: Program, dayIndex: number = 0) {
    assert(program, "Program is undefined in ProgramEngine");
    assert(program.days, "Program days missing in ProgramEngine");
    assert(program.days[dayIndex], "Invalid dayIndex in ProgramEngine");

    this.program = program;
    this.day = program.days[dayIndex];

    console.log("=== ENGINE INIT ===");
    console.log("Program:", program.name);
    console.log("Day:", this.day?.title);
  }

  // -----------------------------
  // WORKOUT LIFECYCLE
  // -----------------------------

  startWorkout() {
    this.currentExerciseIndex = 0;

    this.workoutLog = {
      programId: this.program.id,
      dayId: this.day.id,
      date: new Date().toISOString(),
      exercises: [],
    };
  }

  finishWorkout(): CompletedWorkout | null {
    return this.workoutLog;
  }

  // -----------------------------
  // EXERCISE NAVIGATION
  // -----------------------------

  getCurrentExercise(): Exercise | null {
    return this.day.exercises[this.currentExerciseIndex] ?? null;
  }

  getNextExercise(): Exercise | null {
    if (!this.hasNextExercise()) return null;
    return this.day.exercises[this.currentExerciseIndex + 1];
  }

  hasNextExercise(): boolean {
    return this.currentExerciseIndex < this.day.exercises.length - 1;
  }

  nextExercise() {
    if (this.hasNextExercise()) {
      this.currentExerciseIndex++;
    }
  }

  // -----------------------------
  // SET COMPLETION (FIXED CORE)
  // -----------------------------

 completeSet(set: CompletedSet) {
  if (!this.workoutLog) return;
  if (this.isCurrentExerciseComplete()) return;

  const exercise = this.getCurrentExercise();
  if (!exercise) return;

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

  // -----------------------------
  // NORMALIZE REPS
  // -----------------------------
  let repsCompleted: number | undefined;
  let repsLeft: number | undefined;
  let repsRight: number | undefined;

  if (set.reps !== undefined) {
    if (typeof set.reps === "number") {
      repsCompleted = set.reps;
    } else {
      repsLeft = set.reps.left;
      repsRight = set.reps.right;
    }
  }

  // -----------------------------
  // 🔥 NEW: NORMALIZE HOLD DATA
  // -----------------------------
  let durationSeconds = set.durationSeconds;
  let durationLeft = (set as any).durationLeft;
  let durationRight = (set as any).durationRight;

  // -----------------------------
  // FINAL SET
  // -----------------------------
  const normalizedSet: CompletedSet = {
    setNumber: set.setNumber,

    // reps
    repsCompleted,
    repsLeft,
    repsRight,

    // tempo
    phaseDurations: set.phaseDurations,

    // hold
    durationSeconds,
    durationLeft,
    durationRight,
  };

  exerciseLog.sets.push(normalizedSet);
}

  // -----------------------------
  // PROGRESS HELPERS
  // -----------------------------

  getCompletedSetCount(): number {
    if (!this.workoutLog) return 0;

    const exercise = this.getCurrentExercise();
    if (!exercise) return 0;

    const log = this.workoutLog.exercises.find(
      (e) => e.exerciseId === exercise.id,
    );

    return log?.sets.length ?? 0;
  }

  isCurrentExerciseComplete(): boolean {
    const exercise = this.getCurrentExercise();
    if (!exercise) return false;

    return this.getCompletedSetCount() >= exercise.sets;
  }
}
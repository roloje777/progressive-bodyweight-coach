import { Program } from "../models/Program";
import { CompletedWorkout, CompletedExercise, CompletedSet } from "../models/WorkoutLog";

export class ProgramEngine {
  private program: Program;
  private currentDayIndex = 0;
  private currentExerciseIndex = 0;
  private workoutLog: CompletedWorkout | null = null;

  constructor(program: Program) {
    this.program = program;
  }

  startWorkout() {
    this.workoutLog = {
      programId: this.program.id,
      dayId: this.program.days[this.currentDayIndex].id,
      date: new Date().toISOString(),
      exercises: [],
    };
  }

  getCurrentDay() {
    return this.program.days[this.currentDayIndex];
  }

//   getCurrentExercise() {
//     return this.getCurrentDay().exercises[this.currentExerciseIndex];
//   }

getCurrentExercise() {
  const day = this.getCurrentDay();
  if (!day || !day.exercises || day.exercises.length === 0) return null;

  // ensure currentExerciseIndex is within bounds
  if (this.currentExerciseIndex >= day.exercises.length) {
    this.currentExerciseIndex = day.exercises.length - 1;
  }

  return day.exercises[this.currentExerciseIndex];
}

  nextExercise() {
    if (
      this.currentExerciseIndex <
      this.getCurrentDay().exercises.length - 1
    ) {
      this.currentExerciseIndex++;
    }
  }

  completeSet(set: CompletedSet) {
    if (!this.workoutLog) return;

    const exerciseId = this.getCurrentExercise().id;

    let exerciseLog = this.workoutLog.exercises.find(
      (e) => e.exerciseId === exerciseId
    );

    if (!exerciseLog) {
      exerciseLog = {
        exerciseId,
        sets: [],
      };
      this.workoutLog.exercises.push(exerciseLog);
    }

    exerciseLog.sets.push(set);
  }

  finishWorkout() {
    return this.workoutLog;
  }
}
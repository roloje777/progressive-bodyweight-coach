// engine/ProgramLifecycleEngine.ts

import { getWorkoutHistory } from "../storage/workoutStorage";

import {
  getProgramEvaluations,
  saveProgramEvaluation,
} from "../storage/programEvaluationStorage";

import { evaluateProgramReadiness } from "./ProgramReadinessEngine";
import { evaluateProgramGraduation } from "./ProgramGraduationEngine";

import { ProgramEvaluation } from "../models/ProgramEvaluation";

import { programs } from "../data/programs";

type ProgramLifecycleOptions = {
  coachEnabled?: boolean;
};

export async function evaluateProgramLifecycle(
  programId: string,
  weekIndex: number,
  options: ProgramLifecycleOptions = {},
) {
  // -----------------------------------
  // COACHING
  // -----------------------------------

  const coachEnabled = options.coachEnabled ?? true;

  // -----------------------------------
  // RESOLVE PROGRAM
  // -----------------------------------

  const program = programs.find((item) => item.id === programId);

  if (!program) {
    throw new Error(`ProgramLifecycleEngine: unknown program "${programId}"`);
  }

  // -----------------------------------
  // LOAD WORKOUT HISTORY
  // -----------------------------------

  const history = await getWorkoutHistory();

  const programHistory = history.filter(
    (workout) => workout.programId === programId,
  );

  // -----------------------------------
  // CURRENT WEEK WORKOUTS
  // -----------------------------------
  //
  // Week identity now comes directly from the
  // persisted CompletedSession.
  //
  // No workout-count slicing.
  // No BLOCK_SIZE.
  // -----------------------------------

  const weekWorkouts = programHistory.filter(
    (workout) => workout.weekIndex === weekIndex,
  );

  // -----------------------------------
  // CHECK WEEK COMPLETION
  // -----------------------------------
  //
  // A week is complete only when every configured
  // program day has a completed workout identity.
  //
  // Using Set prevents duplicate records from
  // accidentally making a week appear complete.
  // -----------------------------------

  const completedDayIndexes = new Set(
    weekWorkouts
      .filter((workout) => workout.dayIndex != null)
      .map((workout) => workout.dayIndex as number),
  );

  const weekComplete = program.days.every((_, dayIndex) =>
    completedDayIndexes.has(dayIndex),
  );

  if (!weekComplete) {
    return {
      blockComplete: false,
    };
  }

  // -----------------------------------
  // COACHING IS OPTIONAL
  // -----------------------------------

  if (!coachEnabled) {
    return {
      blockComplete: true,
    };
  }

  // -----------------------------------
  // READINESS HISTORY
  // -----------------------------------
  //
  // Readiness receives all workouts from:
  //
  // Week 1
  // through
  // the week currently being evaluated.
  //
  // This preserves historical MB reconstruction
  // while using real persisted week identity.
  // -----------------------------------

  const readinessHistory = programHistory.filter(
    (workout) => workout.weekIndex != null && workout.weekIndex <= weekIndex,
  );

  // -----------------------------------
  // READINESS
  // -----------------------------------

  console.log("🔄 PROGRAM LIFECYCLE", {
    programId,
    currentWeekIndex: weekIndex,
    programWeeks: program.weeks,
    programHistoryCount: programHistory.length,
    currentWeekWorkoutCount: weekWorkouts.length,
    readinessHistoryCount: readinessHistory.length,
  });

  const readinessReport = evaluateProgramReadiness(readinessHistory, program);

// -----------------------------------
// CREATE WEEK EVALUATION
// -----------------------------------
//
// weekIndex is the zero-based persisted program week.
//
// weekNumber is the human-readable equivalent.
//
// Example:
//
// weekIndex  = 3
// weekNumber = 4
// -----------------------------------

  const evaluation: ProgramEvaluation = {
    programId,

    weekIndex,

    weekNumber: weekIndex + 1,

    readinessReport,

    createdAt: new Date().toISOString(),
  };

  // -----------------------------------
  // LOAD EXISTING EVALUATIONS
  // -----------------------------------

  const existingEvaluations = await getProgramEvaluations();

  const alreadyExists = existingEvaluations.some(
    (evaluation) =>
      evaluation.programId === programId && evaluation.weekIndex === weekIndex,
  );

  // -----------------------------------
  // EXISTING EVALUATION
  // -----------------------------------

 if (alreadyExists) {
  const programEvaluations =
    existingEvaluations.filter(
      (evaluation) =>
        evaluation.programId === programId,
    );

  const graduation =
    evaluateProgramGraduation(
      programEvaluations,
      program,
    );

  console.log("🎓 PROGRAM GRADUATION", {
    programId,

    currentWeekIndex:
      weekIndex,

    evaluationCount:
      programEvaluations.length,

    graduate:
      graduation.graduate,

    recommendation:
      graduation.recommendation,

    nextProgramId:
      graduation.nextProgramId,

    confidence:
      graduation.confidence,

    reasons:
      graduation.reasons,
  });

  return {
    blockComplete: true,

    readinessReport,

    graduation,
  };
}

  // -----------------------------------
  // SAVE EVALUATION
  // -----------------------------------

  await saveProgramEvaluation(evaluation);

  // -----------------------------------
  // LOAD HISTORICAL EVALUATIONS
  // -----------------------------------

  const allEvaluations = await getProgramEvaluations();

  const programEvaluations = allEvaluations.filter(
    (evaluation) => evaluation.programId === programId,
  );

  // -----------------------------------
  // GRADUATION ENGINE
  // -----------------------------------

  const graduation = evaluateProgramGraduation(programEvaluations, program);

  console.log("🎓 PROGRAM GRADUATION", {
  programId,

  currentWeekIndex:
    weekIndex,

  evaluationCount:
    programEvaluations.length,

  graduate:
    graduation.graduate,

  recommendation:
    graduation.recommendation,

  nextProgramId:
    graduation.nextProgramId,

  confidence:
    graduation.confidence,

  reasons:
    graduation.reasons,
});

  // -----------------------------------
  // FINAL RESULT
  // -----------------------------------

  return {
    blockComplete: true,

    readinessReport,

    graduation,
  };
}

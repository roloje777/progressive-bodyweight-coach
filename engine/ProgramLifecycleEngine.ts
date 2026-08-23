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
  blockNumber: number,
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
  // BLOCK SIZE
  // -----------------------------------
  //
  // TEMPORARY:
  //
  // This is still using the existing lifecycle
  // workout-count model.
  //
  // True:
  //
  // Week 1
  //   Day 1
  //   Day 2
  //   Day 3
  //   Day 4
  //
  // Week 2
  //   ...
  //
  // will be implemented when explicit program-week
  // lifecycle / locking is added.
  //
  // For now we preserve the existing behaviour.
  // -----------------------------------

  const BLOCK_SIZE = 4;

  // -----------------------------------
  // CHECK BLOCK COMPLETION
  // -----------------------------------

  const blockStart = blockNumber * BLOCK_SIZE;

  const blockEnd = blockStart + BLOCK_SIZE;

  const blockWorkouts = programHistory.slice(blockStart, blockEnd);

  const blockComplete = blockWorkouts.length >= BLOCK_SIZE;

  if (!blockComplete) {
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
  // IMPORTANT:
  //
  // Readiness must have access to workouts that
  // happened before the current block.
  //
  // Passing only blockWorkouts would prevent:
  //
  // - historical MB reconstruction
  // - same-set historical lookup
  // - previous-set historical fallback
  // - recurring fatigue/pain/form analysis
  //
  // Therefore readiness receives all program history
  // up to the end of the block currently being
  // evaluated.
  // -----------------------------------

  const readinessHistory = programHistory.slice(0, blockEnd);


  // -----------------------------------
  // READINESS
  // -----------------------------------

  const readinessReport = evaluateProgramReadiness(readinessHistory, program);

  // -----------------------------------
  // CREATE EVALUATION
  // -----------------------------------

  const evaluation: ProgramEvaluation = {
    programId,

    blockNumber,

    weekRange: {
      startWeek: blockStart + 1,

      endWeek: blockEnd,
    },

    readinessReport,

    createdAt: new Date().toISOString(),
  };

  // -----------------------------------
  // LOAD EXISTING EVALUATIONS
  // -----------------------------------

  const existingEvaluations = await getProgramEvaluations();

  const alreadyExists = existingEvaluations.some(
    (evaluation) =>
      evaluation.programId === programId &&
      evaluation.blockNumber === blockNumber,
  );

  // -----------------------------------
  // EXISTING EVALUATION
  // -----------------------------------

  if (alreadyExists) {
    const programEvaluations = existingEvaluations.filter(
      (evaluation) => evaluation.programId === programId,
    );

    return {
      blockComplete: true,

      readinessReport,

      graduation: evaluateProgramGraduation(programEvaluations),
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

  const graduation = evaluateProgramGraduation(programEvaluations);

  // -----------------------------------
  // FINAL RESULT
  // -----------------------------------

  return {
    blockComplete: true,

    readinessReport,

    graduation,
  };
}

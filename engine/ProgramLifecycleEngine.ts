// engine/ProgramLifecycleEngine.ts

import { getWorkoutHistory } from "../storage/workoutStorage";

import {
  getProgramEvaluations,
  saveProgramEvaluation,
} from "../storage/programEvaluationStorage";

import { evaluateProgramReadiness } from "./ProgramReadinessEngine";

import { evaluateProgramGraduation } from "./ProgramGraduationEngine";

import { ProgramEvaluation } from "../models/ProgramEvaluation";

export async function evaluateProgramLifecycle(
  programId: string,
  blockNumber: number,
) {
  // -----------------------------------
  // LOAD WORKOUT HISTORY
  // -----------------------------------

  const history = await getWorkoutHistory();

  const programHistory = history.filter(
    (w) => w.programId === programId,
  );

  // -----------------------------------
  // BLOCK SIZE
  // -----------------------------------

  const BLOCK_SIZE = 4;

  // -----------------------------------
  // CHECK BLOCK COMPLETION
  // -----------------------------------

  const blockStart =
    blockNumber * BLOCK_SIZE;

  const blockEnd =
    blockStart + BLOCK_SIZE;

  const blockWorkouts =
    programHistory.slice(
      blockStart,
      blockEnd,
    );

  const blockComplete =
    blockWorkouts.length >= BLOCK_SIZE;

  if (!blockComplete) {
    return {
      blockComplete: false,
    };
  }

  // -----------------------------------
  // READINESS
  // -----------------------------------

  const readinessReport =
    evaluateProgramReadiness(
      blockWorkouts,
    );

  // -----------------------------------
  // CREATE EVALUATION
  // -----------------------------------

  const evaluation: ProgramEvaluation = {
    programId,

    blockNumber,

    weekRange: {
      startWeek:
        blockStart + 1,

      endWeek: blockEnd,
    },

    readinessReport,

    createdAt:
      new Date().toISOString(),
  };

  // -----------------------------------
  // SAVE EVALUATION
  // -----------------------------------

  const existingEvaluations =
  await getProgramEvaluations();

const alreadyExists =
  existingEvaluations.some(
    (e) =>
      e.programId === programId &&
      e.blockNumber === blockNumber,
  );

if (alreadyExists) {
  return {
    blockComplete: true,

    readinessReport,

    graduation:
      evaluateProgramGraduation(
        existingEvaluations.filter(
          (e) =>
            e.programId === programId,
        ),
      ),
  };
}

  await saveProgramEvaluation(
    evaluation,
  );

  // -----------------------------------
  // LOAD HISTORICAL EVALUATIONS
  // -----------------------------------

  const allEvaluations =
    await getProgramEvaluations();

  const programEvaluations =
    allEvaluations.filter(
      (e) =>
        e.programId === programId,
    );

  // -----------------------------------
  // GRADUATION ENGINE
  // -----------------------------------

  const graduation =
    evaluateProgramGraduation(
      programEvaluations,
    );

  // -----------------------------------
  // FINAL RESULT
  // -----------------------------------

  return {
    blockComplete: true,

    readinessReport,

    graduation,
  };
}
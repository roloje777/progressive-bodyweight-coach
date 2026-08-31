// engine/ImmediatePainInterceptionEngine.ts

export type ImmediatePainAnswers = {
  painStillPresent: boolean | null;
  affectedGoodForm: boolean | null;
};

export type ImmediatePainDecision =
  | {
      status: "questions-incomplete";
      recoveryRequired: false;
      canContinueProgram: false;
      reasons: string[];
    }
  | {
      status: "recovery-required";
      recoveryRequired: true;
      canContinueProgram: false;
      reasons: string[];
    }
  | {
      status: "continue-allowed";
      recoveryRequired: false;
      canContinueProgram: true;
      reasons: string[];
    };

/**
 * Immediate pain interception is deliberately separate from
 * ProgramReadinessEngine.
 *
 * ProgramReadinessEngine handles cycle-level readiness and recurring
 * patterns. This engine handles the immediate post-workout decision after
 * the user reports "Joint discomfort ⚠️".
 *
 * It does not diagnose an injury.
 */
export function evaluateImmediatePainInterception(args: {
  answers: ImmediatePainAnswers;
  lifecycleRequiresRecovery?: boolean;
}): ImmediatePainDecision {
  const {
    answers,
    lifecycleRequiresRecovery = false,
  } = args;

  if (
    answers.painStillPresent == null ||
    answers.affectedGoodForm == null
  ) {
    return {
      status: "questions-incomplete",
      recoveryRequired: false,
      canContinueProgram: false,
      reasons: [],
    };
  }

  const reasons: string[] = [];

  if (lifecycleRequiresRecovery) {
    reasons.push(
      "Your recent training history already meets the Coach's recovery threshold.",
    );
  }

  if (answers.painStillPresent) {
    reasons.push("The discomfort is still present after the workout.");
  }

  if (answers.affectedGoodForm) {
    reasons.push(
      "The discomfort affected your ability to complete the movement with good form.",
    );
  }

  if (reasons.length > 0) {
    return {
      status: "recovery-required",
      recoveryRequired: true,
      canContinueProgram: false,
      reasons,
    };
  }

  return {
    status: "continue-allowed",
    recoveryRequired: false,
    canContinueProgram: true,
    reasons: [
      "The discomfort is no longer present and it did not affect good-form completion.",
    ],
  };
}

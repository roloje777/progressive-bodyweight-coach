import {
  ImmediatePainAnswers,
  ImmediatePainDecision,
} from "@/engine/ImmediatePainInterceptionEngine";

export type ImmediatePainScenario = {
  id:
    | "immediate-pain-continue-allowed"
    | "immediate-pain-recovery-required";

  title: string;
  description: string;

  answers: ImmediatePainAnswers;
  lifecycleRequiresRecovery: boolean;

  expected: {
    status: ImmediatePainDecision["status"];
    recoveryRequired: boolean;
    canContinueProgram: boolean;
  };
};

export const immediatePainScenarios: ImmediatePainScenario[] = [
  {
    id: "immediate-pain-continue-allowed",
    title: "Immediate Pain — Continue Allowed",
    description:
      "Joint discomfort was reported, but it is no longer present and it did not affect good-form completion. The Coach must allow normal-program continuation while still offering recovery as an optional choice.",
    answers: {
      painStillPresent: false,
      affectedGoodForm: false,
    },
    lifecycleRequiresRecovery: false,
    expected: {
      status: "continue-allowed",
      recoveryRequired: false,
      canContinueProgram: true,
    },
  },
  {
    id: "immediate-pain-recovery-required",
    title: "Immediate Pain — Recovery Required",
    description:
      "Joint discomfort is still present after the workout. The Coach must require recovery and must not allow Continue Program.",
    answers: {
      painStillPresent: true,
      affectedGoodForm: false,
    },
    lifecycleRequiresRecovery: false,
    expected: {
      status: "recovery-required",
      recoveryRequired: true,
      canContinueProgram: false,
    },
  },
];

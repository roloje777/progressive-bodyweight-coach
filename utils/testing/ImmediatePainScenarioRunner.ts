import {
  evaluateImmediatePainInterception,
} from "@/engine/ImmediatePainInterceptionEngine";
import { ImmediatePainScenario } from "@/tests/immediatePainScenarios";

export type ImmediatePainScenarioResult = {
  scenarioId: string;
  expectedStatus: string;
  actualStatus: string;
  expectedRecoveryRequired: boolean;
  actualRecoveryRequired: boolean;
  expectedCanContinueProgram: boolean;
  actualCanContinueProgram: boolean;
};

export function runImmediatePainScenario(
  scenario: ImmediatePainScenario,
): ImmediatePainScenarioResult {
  const actual = evaluateImmediatePainInterception({
    answers: scenario.answers,
    lifecycleRequiresRecovery: scenario.lifecycleRequiresRecovery,
  });

  const failures: string[] = [];

  if (actual.status !== scenario.expected.status) {
    failures.push(
      `status expected ${scenario.expected.status}, got ${actual.status}`,
    );
  }

  if (actual.recoveryRequired !== scenario.expected.recoveryRequired) {
    failures.push(
      `recoveryRequired expected ${scenario.expected.recoveryRequired}, got ${actual.recoveryRequired}`,
    );
  }

  if (actual.canContinueProgram !== scenario.expected.canContinueProgram) {
    failures.push(
      `canContinueProgram expected ${scenario.expected.canContinueProgram}, got ${actual.canContinueProgram}`,
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Immediate pain scenario ${scenario.id} failed: ${failures.join("; ")}`,
    );
  }

  console.log("🛡️ IMMEDIATE PAIN SCENARIO PASSED", {
    scenario: scenario.id,
    answers: scenario.answers,
    lifecycleRequiresRecovery: scenario.lifecycleRequiresRecovery,
    expected: scenario.expected,
    actual,
  });

  return {
    scenarioId: scenario.id,
    expectedStatus: scenario.expected.status,
    actualStatus: actual.status,
    expectedRecoveryRequired: scenario.expected.recoveryRequired,
    actualRecoveryRequired: actual.recoveryRequired,
    expectedCanContinueProgram: scenario.expected.canContinueProgram,
    actualCanContinueProgram: actual.canContinueProgram,
  };
}

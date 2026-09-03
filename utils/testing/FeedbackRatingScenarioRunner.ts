// utils/testing/FeedbackRatingScenarioRunner.ts

import {
  getWorkoutFeedbackAvailabilityContext,
} from "@/engine/MatchOrBeatFeedbackEngine";
import { interpretWorkoutFeedback } from "@/engine/WorkoutFeedbackEngine";
import { isWorkoutFeedbackComplete } from "@/models/WorkoutFeedback";
import {
  FeedbackCompatibilityScenario,
  FeedbackRatingAvailabilityScenario,
  FeedbackValidationScenario,
} from "@/tests/feedbackRatingScenarios";

function assertEqual<T>(
  label: string,
  actual: T,
  expected: T,
): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${String(expected)}, received ${String(actual)}`,
    );
  }
}

function assertRatingsEqual(
  actual: readonly number[],
  expected: readonly number[],
): void {
  const actualText = actual.join(",");
  const expectedText = expected.join(",");

  if (actualText !== expectedText) {
    throw new Error(
      `Allowed ratings: expected [${expectedText}], received [${actualText}]`,
    );
  }
}

export function runFeedbackRatingAvailabilityScenario(
  scenario: FeedbackRatingAvailabilityScenario,
) {
  const context = getWorkoutFeedbackAvailabilityContext({
    weekIndex: scenario.weekIndex,
    performance: {
      applicableTargets: 1000,
      metTargets: Math.round(scenario.mbSuccessRate * 1000),
      successRate: scenario.mbSuccessRate,
      sufficientHistory: scenario.weekIndex > 0,
      trend: scenario.mbSuccessRate,
    },
    mainCompletion: scenario.mainCompletion,
  });

  assertRatingsEqual(
    context.allowedRatings,
    scenario.expectedAllowedRatings,
  );

  return {
    actualAllowedRatings: context.allowedRatings,
    expectedAllowedRatings: scenario.expectedAllowedRatings,
    mode: context.mode,
  };
}

export function runFeedbackValidationScenario(
  scenario: FeedbackValidationScenario,
) {
  const actualComplete = isWorkoutFeedbackComplete({
    rating: scenario.rating,
    tags: scenario.tags,
  });

  assertEqual(
    "Feedback completeness",
    actualComplete,
    scenario.expectedComplete,
  );

  return {
    actualComplete,
    expectedComplete: scenario.expectedComplete,
  };
}

export function runFeedbackCompatibilityScenario(
  scenario: FeedbackCompatibilityScenario,
) {
  const signals = interpretWorkoutFeedback({
    rating: 2,
    tags: scenario.tags,
  });

  assertEqual("Pain signal", signals.pain, scenario.expected.pain);
  assertEqual("Fatigue signal", signals.fatigue, scenario.expected.fatigue);
  assertEqual(
    "Form breakdown signal",
    signals.formBreakdown,
    scenario.expected.formBreakdown,
  );

  return {
    pain: signals.pain,
    fatigue: signals.fatigue,
    formBreakdown: signals.formBreakdown,
  };
}

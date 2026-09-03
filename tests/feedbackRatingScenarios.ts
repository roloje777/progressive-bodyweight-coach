// tests/feedbackRatingScenarios.ts

import { AllowedFeedbackRating } from "@/engine/MatchOrBeatFeedbackEngine";
import { WorkoutFeedbackTagId } from "@/models/WorkoutFeedback";

export type FeedbackRatingAvailabilityScenario = {
  id: string;
  title: string;
  description: string;
  weekIndex: number;
  mbSuccessRate: number;
  mainCompletion: number;
  expectedAllowedRatings: AllowedFeedbackRating[];
};

export const feedbackRatingAvailabilityScenarios: FeedbackRatingAvailabilityScenario[] = [
  {
    id: "feedback-week1-unrestricted",
    title: "Week 1 — Unrestricted Baseline",
    description:
      "Week 1 remains unrestricted while Match-or-Beat baseline data is being collected.",
    weekIndex: 0,
    mbSuccessRate: 0,
    mainCompletion: 0,
    expectedAllowedRatings: [1, 2, 3, 4, 5],
  },
  {
    id: "feedback-below-65-mb",
    title: "Week 2+ — Below 65% MB",
    description:
      "Even with full main-workout completion, MB below 65% restricts feedback to ratings 1–2.",
    weekIndex: 1,
    mbSuccessRate: 0.60,
    mainCompletion: 1,
    expectedAllowedRatings: [1, 2],
  },
  {
    id: "feedback-65-70-standard",
    title: "65% MB + 70% Main",
    description:
      "The standard threshold unlocks rating 3.",
    weekIndex: 1,
    mbSuccessRate: 0.65,
    mainCompletion: 0.70,
    expectedAllowedRatings: [1, 2, 3],
  },
  {
    id: "feedback-80-85-strong",
    title: "80% MB + 85% Main",
    description:
      "The strong threshold unlocks rating 4.",
    weekIndex: 1,
    mbSuccessRate: 0.80,
    mainCompletion: 0.85,
    expectedAllowedRatings: [1, 2, 3, 4],
  },
  {
    id: "feedback-100-95-maximum",
    title: "100% MB + 95% Main",
    description:
      "The maximum threshold unlocks all ratings, including Too Easy.",
    weekIndex: 1,
    mbSuccessRate: 1,
    mainCompletion: 0.95,
    expectedAllowedRatings: [1, 2, 3, 4, 5],
  },
  {
    id: "feedback-weaker-main-controls",
    title: "90% MB + 78% Main",
    description:
      "Strong MB performance cannot compensate for weaker main-workout completion.",
    weekIndex: 1,
    mbSuccessRate: 0.90,
    mainCompletion: 0.78,
    expectedAllowedRatings: [1, 2, 3],
  },
  {
    id: "feedback-weaker-mb-controls",
    title: "75% MB + 95% Main",
    description:
      "High main-workout completion cannot compensate for weaker MB performance.",
    weekIndex: 1,
    mbSuccessRate: 0.75,
    mainCompletion: 0.95,
    expectedAllowedRatings: [1, 2, 3],
  },
  {
    id: "feedback-boundary-64-9",
    title: "Boundary — 64.9% MB",
    description:
      "Just below the 65% MB threshold remains restricted to ratings 1–2.",
    weekIndex: 1,
    mbSuccessRate: 0.649,
    mainCompletion: 1,
    expectedAllowedRatings: [1, 2],
  },
  {
    id: "feedback-boundary-79-9",
    title: "Boundary — 79.9% MB",
    description:
      "Just below the 80% MB threshold cannot unlock rating 4.",
    weekIndex: 1,
    mbSuccessRate: 0.799,
    mainCompletion: 1,
    expectedAllowedRatings: [1, 2, 3],
  },
  {
    id: "feedback-boundary-94-9-main",
    title: "Boundary — 94.9% Main",
    description:
      "Even with 100% MB, just below 95% main completion cannot unlock rating 5.",
    weekIndex: 1,
    mbSuccessRate: 1,
    mainCompletion: 0.949,
    expectedAllowedRatings: [1, 2, 3, 4],
  },
];

export type FeedbackValidationScenario = {
  id: string;
  title: string;
  rating: number | null;
  tags: WorkoutFeedbackTagId[];
  expectedComplete: boolean;
};

export const feedbackValidationScenarios: FeedbackValidationScenario[] = [
  {
    id: "feedback-validation-none",
    title: "No Rating",
    rating: null,
    tags: [],
    expectedComplete: false,
  },
  {
    id: "feedback-validation-rating-only",
    title: "Rating Without Reason",
    rating: 3,
    tags: [],
    expectedComplete: false,
  },
  {
    id: "feedback-validation-rating-and-reason",
    title: "Rating + Reason",
    rating: 3,
    tags: ["perfect-difficulty"],
    expectedComplete: true,
  },
];

export type FeedbackCompatibilityScenario = {
  id: string;
  title: string;
  tags: string[];
  expected: {
    pain: boolean;
    fatigue: boolean;
    formBreakdown: boolean;
  };
};

export const feedbackCompatibilityScenarios: FeedbackCompatibilityScenario[] = [
  {
    id: "feedback-stable-joint-discomfort",
    title: "Stable ID — Joint Discomfort",
    tags: ["joint-discomfort"],
    expected: { pain: true, fatigue: false, formBreakdown: false },
  },
  {
    id: "feedback-legacy-joint-discomfort",
    title: "Legacy — Joint Discomfort",
    tags: ["Joint discomfort ⚠️"],
    expected: { pain: true, fatigue: false, formBreakdown: false },
  },
  {
    id: "feedback-stable-low-energy",
    title: "Stable ID — Low Energy",
    tags: ["low-energy"],
    expected: { pain: false, fatigue: true, formBreakdown: false },
  },
  {
    id: "feedback-legacy-low-energy",
    title: "Legacy — Low Energy",
    tags: ["Low energy 😴"],
    expected: { pain: false, fatigue: true, formBreakdown: false },
  },
  {
    id: "feedback-stable-form-breakdown",
    title: "Stable ID — Form Breakdown",
    tags: ["form-breakdown"],
    expected: { pain: false, fatigue: false, formBreakdown: true },
  },
  {
    id: "feedback-legacy-form-breakdown-plain",
    title: "Legacy — Form Breakdown Plain",
    tags: ["Form broke down"],
    expected: { pain: false, fatigue: false, formBreakdown: true },
  },
  {
    id: "feedback-legacy-form-breakdown-emoji",
    title: "Legacy — Form Breakdown Emoji",
    tags: ["Form broke down 😵‍💫"],
    expected: { pain: false, fatigue: false, formBreakdown: true },
  },
];

// tests/coachingScenarios.ts

export type SeedFeedback = {
  rating: number;
  tags: string[];
  comment?: string;
};

export type HistoricalFeedbackOverride = {
  /**
   * Human-readable values:
   *
   * Week 1 = 1
   * Day 1  = 1
   */
  week: number;
  day: number;

  feedback: SeedFeedback;
};

export type ExpectedCoachingResult = {
  progressionBlocked: boolean;
  progressionCandidate: boolean;
  deloadCandidate: boolean;

  recommendation:
    | "advance"
    | "repeat"
    | "deload";
};

export type FinalPerformanceMode =
  | "meetOrBeat"
  | "failMatchOrBeat";

export type CoachingScenario = {
  id: string;

  title: string;

  description: string;

  /**
   * History is seeded up to this point.
   *
   * The final workout is then completed normally
   * by the user.
   */
  seedUntil: {
    week: number;
    day: number;
  };

  /**
   * Feedback inserted into specific historical
   * workouts.
   */
  historicalFeedback?: HistoricalFeedbackOverride[];

  /**
   * What the user should do during the final,
   * real workout.
   */
  finalPerformance: FinalPerformanceMode;

  finalFeedback: SeedFeedback;

  expected: ExpectedCoachingResult;
};

const NORMAL_FEEDBACK: SeedFeedback = {
  rating: 3,
  tags: [],
};

const PAIN_FEEDBACK: SeedFeedback = {
  rating: 2,
  tags: ["Joint discomfort ⚠️"],
};

const FORM_FEEDBACK: SeedFeedback = {
  rating: 2,
  tags: ["Form broke down"],
};

const FATIGUE_FEEDBACK: SeedFeedback = {
  rating: 2,
  tags: ["Low energy 😴"],
};

/**
 * -------------------------------------------------------
 * COACHING TEST SCENARIOS
 * -------------------------------------------------------
 *
 * Every scenario seeds:
 *
 * Week 1 Day 1
 * through
 * Week 4 Day 3
 *
 * The user then completes:
 *
 * Week 4 Day 4
 *
 * normally through the application.
 */
export const coachingScenarios: CoachingScenario[] = [
  {
    id: "normal-pass",

    title: "Normal — Pass MB",

    description:
      "Healthy history. Complete the final workout by meeting or beating the Match-or-Beat targets.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...NORMAL_FEEDBACK,
    },

    expected: {
      progressionBlocked: false,
      progressionCandidate: true,
      deloadCandidate: false,
      recommendation: "advance",
    },
  },

  {
    id: "normal-fail-mb",

    title: "Normal — Fail MB",

    description:
      "Healthy history. Fail most Match-or-Beat targets during the final workout.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    finalPerformance:
      "failMatchOrBeat",

    finalFeedback: {
      rating: 2,
      tags: [],
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: false,
      recommendation: "repeat",
    },
  },

  {
    id: "current-pain",

    title: "Current Pain",

    description:
      "Healthy history. Report joint discomfort on the final workout.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...PAIN_FEEDBACK,
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: false,
      recommendation: "repeat",
    },
  },

  {
    id: "repeated-pain",

    title: "Repeated Pain",

    description:
      "Week 4 Day 3 contains joint discomfort. Report joint discomfort again on the final workout.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    historicalFeedback: [
      {
        week: 4,
        day: 3,
        feedback: {
          ...PAIN_FEEDBACK,
        },
      },
    ],

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...PAIN_FEEDBACK,
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: true,
      recommendation: "deload",
    },
  },

  {
    id: "current-form",

    title: "Current Form Breakdown",

    description:
      "Healthy history. Select Form broke down on the final workout.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...FORM_FEEDBACK,
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: false,
      recommendation: "repeat",
    },
  },

  {
    id: "repeated-form",

    title: "Repeated Form Breakdown",

    description:
      "Week 4 Days 2 and 3 contain form breakdown. Report form breakdown again on Day 4.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    historicalFeedback: [
      {
        week: 4,
        day: 2,
        feedback: {
          ...FORM_FEEDBACK,
        },
      },

      {
        week: 4,
        day: 3,
        feedback: {
          ...FORM_FEEDBACK,
        },
      },
    ],

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...FORM_FEEDBACK,
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: true,
      recommendation: "deload",
    },
  },

  {
    id: "current-fatigue",

    title: "Current Fatigue",

    description:
      "Healthy history. Report Low energy on the final workout.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...FATIGUE_FEEDBACK,
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: false,
      recommendation: "repeat",
    },
  },

  {
    id: "two-recent-fatigue",

    title: "Two Recent Fatigue Workouts",

    description:
      "Week 4 Days 2 and 3 contain fatigue. Complete Day 4 normally without fatigue.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    historicalFeedback: [
      {
        week: 4,
        day: 2,
        feedback: {
          ...FATIGUE_FEEDBACK,
        },
      },

      {
        week: 4,
        day: 3,
        feedback: {
          ...FATIGUE_FEEDBACK,
        },
      },
    ],

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...NORMAL_FEEDBACK,
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: false,
      recommendation: "repeat",
    },
  },

  {
    id: "three-recurring-fatigue",

    title: "Three Recurring Fatigue Workouts",

    description:
      "Week 4 Days 2 and 3 contain fatigue. Report fatigue again on Day 4.",

    seedUntil: {
      week: 4,
      day: 3,
    },

    historicalFeedback: [
      {
        week: 4,
        day: 2,
        feedback: {
          ...FATIGUE_FEEDBACK,
        },
      },

      {
        week: 4,
        day: 3,
        feedback: {
          ...FATIGUE_FEEDBACK,
        },
      },
    ],

    finalPerformance: "meetOrBeat",

    finalFeedback: {
      ...FATIGUE_FEEDBACK,
    },

    expected: {
      progressionBlocked: true,
      progressionCandidate: false,
      deloadCandidate: true,
      recommendation: "deload",
    },
  },
];


export type DirectCoachingScenario = {
  id:
    | "fatigue-deload-direct"
    | "fatigue-verification-direct"
    | "pain-deload-direct"
    | "pain-verification-direct";
  title: string;
  description: string;
  targetWeek: number;
  targetDay: number;
  reason: "fatigue" | "pain";
  phase: "deload" | "verification";
};

/**
 * Fast-entry scenarios for debugging the deload UI/state machine.
 *
 * Unlike the readiness scenarios above, these do not ask the user to
 * manufacture the trigger. They seed the required history and persisted
 * deload state directly.
 */
export const directCoachingScenarios: DirectCoachingScenario[] = [
  {
    id: "fatigue-deload-direct",
    title: "Direct Fatigue Deload Test",
    description:
      "Seeds four healthy Level 1 weeks and opens Week 5 Day 1 with an active fatigue deload.",
    targetWeek: 5,
    targetDay: 1,
    reason: "fatigue",
    phase: "deload",
  },
  {
    id: "fatigue-verification-direct",
    title: "Direct Fatigue Verification Test",
    description:
      "Seeds four healthy weeks plus a completed 60% fatigue-deload week, then opens Week 6 Day 1 in verification mode.",
    targetWeek: 6,
    targetDay: 1,
    reason: "fatigue",
    phase: "verification",
  },
  {
    id: "pain-deload-direct",
    title: "Direct Pain Recovery Test",
    description:
      "Seeds four healthy Level 1 weeks and opens Week 5 Day 1 in pain-recovery mode with normal strength work paused.",
    targetWeek: 5,
    targetDay: 1,
    reason: "pain",
    phase: "deload",
  },
  {
    id: "pain-verification-direct",
    title: "Direct Pain Verification Test",
    description:
      "Seeds four healthy weeks plus a completed pain-recovery cycle with no strength work, then opens Week 6 Day 1 in verification mode.",
    targetWeek: 6,
    targetDay: 1,
    reason: "pain",
    phase: "verification",
  },
];

export function getCoachingScenario(
  scenarioId: string,
): CoachingScenario | undefined {
  return coachingScenarios.find(
    (scenario) =>
      scenario.id === scenarioId,
  );
}
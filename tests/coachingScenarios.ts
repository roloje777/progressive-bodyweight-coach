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

export function getCoachingScenario(
  scenarioId: string,
): CoachingScenario | undefined {
  return coachingScenarios.find(
    (scenario) =>
      scenario.id === scenarioId,
  );
}
import { TrainingScheduleStatusType } from "@/models/TrainingSchedule";

export type TrainingScheduleScenarioKind =
  | "pain-initial"
  | "pain-after-recovery"
  | "pain-old-cycle"
  | "normal-advisory"
  | "normal-same-day"
  | "normal-long-gap";

export type TrainingScheduleScenario = {
  id:
    | "pain-initial-rest-required"
    | "pain-one-full-rest-day"
    | "pain-two-full-rest-days-eligible"
    | "pain-between-recovery-locked"
    | "pain-next-recovery-eligible"
    | "pain-extra-rest-eligible"
    | "pain-old-cycle-ignored"
    | "normal-recovery-recommended-allowed"
    | "normal-same-day-double-workout"
    | "normal-long-gap-training-available";

  title: string;
  description: string;
  kind: TrainingScheduleScenarioKind;

  /**
   * Calendar offset from the real device date used when seeding the
   * initial pain-recovery activation timestamp.
   *
   * 0 = today
   * 2 = two calendar days ago -> one FULL rest day completed today
   * 3 = three calendar days ago -> two FULL rest days completed today
   */
  activationDaysAgo?: number;

  /**
   * When present, Recovery Day 1 is seeded this many calendar days ago
   * and the app is positioned on Recovery Day 2.
   */
  previousRecoveryDaysAgo?: number;

  /**
   * Seeds a deload-pain session outside the current recovery-cycle week.
   * ProgressContext should ignore it when deriving the current-cycle lock.
   */
  oldCycleRecoveryDaysAgo?: number;

  expected: {
    status: TrainingScheduleStatusType;
    canTrain: boolean;
    restDaysCompleted: number;
    minimumRestDaysRequired?: number;
    currentDay: number;

    /**
     * Optional Phase 5.7 regression assertions.
     *
     * These are especially useful for proving that the scheduler recognises
     * multiple sessions on the same calendar day rather than treating the
     * test only as another generic rest recommendation.
     */
    consecutiveTrainingSessions?: number;
    sessionsToday?: number;
  };
};

/**
 * Phase 5.7 direct scheduling scenarios.
 *
 * These deliberately manipulate persisted timestamps rather than the device
 * clock. Home therefore evaluates the normal production TrainingScheduleEngine
 * against realistic history while each scenario can represent a different day.
 */
export const trainingScheduleScenarios: TrainingScheduleScenario[] = [
  {
    id: "normal-recovery-recommended-allowed",
    title: "Normal — Recovery Recommended but Allowed",
    description:
      "Normal Day 2 was completed today and the recommended cycle has a rest slot before Day 3. Coach should recommend recovery, but training must remain allowed.",
    kind: "normal-advisory",
    expected: {
      status: "rest-recommended",
      canTrain: true,
      restDaysCompleted: 0,
      minimumRestDaysRequired: 1,
      currentDay: 3,
    },
  },
  {
    id: "normal-same-day-double-workout",
    title: "Normal — Same-Day Double Workout",
    description:
      "Normal Day 1 and Day 2 were both completed today. The scheduler must recognise two sessions today, keep Day 3 available, and recommend the planned recovery before Day 3.",
    kind: "normal-same-day",
    expected: {
      status: "rest-recommended",
      canTrain: true,
      restDaysCompleted: 0,
      minimumRestDaysRequired: 1,
      currentDay: 3,
      consecutiveTrainingSessions: 2,
      sessionsToday: 2,
    },
  },
  {
    id: "normal-long-gap-training-available",
    title: "Normal — Long-Gap Training Available",
    description:
      "Normal Day 2 was completed four calendar days ago. The recommended recovery has already been exceeded, so Day 3 must remain available with no recovery recommendation.",
    kind: "normal-long-gap",
    expected: {
      status: "training-available",
      canTrain: true,
      restDaysCompleted: 3,
      currentDay: 3,
      consecutiveTrainingSessions: 1,
      sessionsToday: 0,
    },
  },
  {
    id: "pain-initial-rest-required",
    title: "Pain — Initial Rest Required",
    description:
      "Pain recovery is activated today. Recovery Day 1 must be locked because no full rest days have elapsed.",
    kind: "pain-initial",
    activationDaysAgo: 0,
    expected: {
      status: "rest-required",
      canTrain: false,
      restDaysCompleted: 0,
      minimumRestDaysRequired: 2,
      currentDay: 1,
    },
  },
  {
    id: "pain-one-full-rest-day",
    title: "Pain — One Full Rest Day",
    description:
      "Pain recovery was activated two calendar days ago. Exactly one full rest day has elapsed, so Recovery Day 1 must remain locked.",
    kind: "pain-initial",
    activationDaysAgo: 2,
    expected: {
      status: "rest-required",
      canTrain: false,
      restDaysCompleted: 1,
      minimumRestDaysRequired: 2,
      currentDay: 1,
    },
  },
  {
    id: "pain-two-full-rest-days-eligible",
    title: "Pain — Two Full Rest Days / Eligible",
    description:
      "Pain recovery was activated three calendar days ago. Two full rest days have elapsed, so Recovery Day 1 must be available.",
    kind: "pain-initial",
    activationDaysAgo: 3,
    expected: {
      status: "training-available",
      canTrain: true,
      restDaysCompleted: 2,
      minimumRestDaysRequired: 2,
      currentDay: 1,
    },
  },
  {
    id: "pain-between-recovery-locked",
    title: "Pain — Between Recovery Sessions / Locked",
    description:
      "Recovery Day 1 was completed two calendar days ago. Only one full rest day has elapsed, so Recovery Day 2 must be locked.",
    kind: "pain-after-recovery",
    activationDaysAgo: 10,
    previousRecoveryDaysAgo: 2,
    expected: {
      status: "rest-required",
      canTrain: false,
      restDaysCompleted: 1,
      minimumRestDaysRequired: 2,
      currentDay: 2,
    },
  },
  {
    id: "pain-next-recovery-eligible",
    title: "Pain — Next Recovery Eligible",
    description:
      "Recovery Day 1 was completed three calendar days ago. Two full rest days have elapsed, so Recovery Day 2 must be available.",
    kind: "pain-after-recovery",
    activationDaysAgo: 10,
    previousRecoveryDaysAgo: 3,
    expected: {
      status: "training-available",
      canTrain: true,
      restDaysCompleted: 2,
      minimumRestDaysRequired: 2,
      currentDay: 2,
    },
  },
  {
    id: "pain-extra-rest-eligible",
    title: "Pain — Extra Rest / Still Eligible",
    description:
      "Recovery Day 1 was completed five calendar days ago. Extra rest must never make the next recovery session unavailable.",
    kind: "pain-after-recovery",
    activationDaysAgo: 12,
    previousRecoveryDaysAgo: 5,
    expected: {
      status: "training-available",
      canTrain: true,
      restDaysCompleted: 4,
      minimumRestDaysRequired: 2,
      currentDay: 2,
    },
  },
  {
    id: "pain-old-cycle-ignored",
    title: "Pain — Old Recovery Cycle Ignored",
    description:
      "An old deload-pain workout exists, but it belongs to another week. The current pain cycle was activated today and Recovery Day 1 must still be locked.",
    kind: "pain-old-cycle",
    activationDaysAgo: 0,
    oldCycleRecoveryDaysAgo: 10,
    expected: {
      status: "rest-required",
      canTrain: false,
      restDaysCompleted: 0,
      minimumRestDaysRequired: 2,
      currentDay: 1,
    },
  },
];

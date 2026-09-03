import { RecommendedTrainingCycle } from "../models/Program";
import {
  TimestampedTrainingSession,
  TrainingScheduleStatus,
} from "../models/TrainingSchedule";
import {
  DEFAULT_TRAINING_SCHEDULE_CONFIG,
  normalizeTrainingScheduleConfig,
  TrainingScheduleConfig,
} from "../config/TrainingScheduleConfig";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toLocalDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function sortSessionsChronologically<
  T extends TimestampedTrainingSession,
>(sessions: T[]): T[] {
  return [...sessions].sort(
    (a, b) =>
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );
}

export function isSameCalendarDay(
  first: string | Date,
  second: string | Date,
): boolean {
  return toLocalDateKey(first) === toLocalDateKey(second);
}

export function countSessionsOnCalendarDay(
  sessions: TimestampedTrainingSession[],
  day: Date = new Date(),
): number {
  return sessions.filter((session) =>
    isSameCalendarDay(session.completedAt, day),
  ).length;
}

/**
 * Counts only FULL calendar days between two events.
 *
 * Examples:
 * Friday -> Saturday = 0
 * Friday -> Sunday   = 1  (Saturday)
 * Friday -> Monday   = 2  (Saturday + Sunday)
 */
export function countFullRestDaysBetween(
  earlier: string | Date,
  later: string | Date,
): number {
  const start = startOfLocalDay(earlier).getTime();
  const end = startOfLocalDay(later).getTime();

  if (end <= start) {
    return 0;
  }

  return Math.max(Math.round((end - start) / DAY_MS) - 1, 0);
}

/**
 * Earliest calendar day that becomes eligible after a number of FULL rest days.
 *
 * Example:
 * Friday + 2 full rest days => Monday
 */
export function addEligibleDateAfterFullRestDays(
  from: string | Date,
  requiredRestDays: number,
): Date {
  const date = startOfLocalDay(from);
  date.setDate(date.getDate() + requiredRestDays + 1);
  return date;
}

/**
 * Returns how many recommended rest slots exist between two workout days
 * in the program's advisory cycle.
 *
 * It also supports crossing the cycle boundary:
 * Day 4 -> Day 1 in the 4-day cycle returns 2.
 */
export function getRecommendedRestSlotsBetween(
  cycle: RecommendedTrainingCycle,
  previousDayIndex: number,
  nextDayIndex: number,
): number {
  const { slots } = cycle;

  const previousSlotIndex = slots.findIndex(
    (slot) => slot.type === "training" && slot.dayIndex === previousDayIndex,
  );

  const nextSlotIndex = slots.findIndex(
    (slot) => slot.type === "training" && slot.dayIndex === nextDayIndex,
  );

  if (previousSlotIndex < 0 || nextSlotIndex < 0) {
    return 0;
  }

  let restSlots = 0;
  let cursor = (previousSlotIndex + 1) % slots.length;

  while (cursor !== nextSlotIndex) {
    if (slots[cursor].type === "rest") {
      restSlots += 1;
    }

    cursor = (cursor + 1) % slots.length;
  }

  return restSlots;
}

/**
 * A training session is considered consecutive when there were no full
 * calendar rest days between it and the preceding session.
 *
 * Same-day double sessions are therefore deliberately supported.
 */
export function getConsecutiveTrainingSessionCount(
  sessions: TimestampedTrainingSession[],
): number {
  if (sessions.length === 0) {
    return 0;
  }

  const sorted = sortSessionsChronologically(sessions);

  let count = 1;

  for (let i = sorted.length - 1; i > 0; i -= 1) {
    const restDays = countFullRestDaysBetween(
      sorted[i - 1].completedAt,
      sorted[i].completedAt,
    );

    if (restDays > 0) {
      break;
    }

    count += 1;
  }

  return count;
}

/**
 * Normal training is ALWAYS advisory in Phase 5.1.
 *
 * The result may be "rest-recommended", but canTrain remains true.
 */
export function evaluateNormalTrainingSchedule(args: {
  cycle: RecommendedTrainingCycle;
  currentDayIndex: number;
  history: TimestampedTrainingSession[];
  now?: Date;
  config?: Partial<TrainingScheduleConfig>;
}): TrainingScheduleStatus {
  const {
    cycle,
    currentDayIndex,
    history,
    now = new Date(),
    config: suppliedConfig,
  } = args;

  const config = normalizeTrainingScheduleConfig(suppliedConfig);

  const sorted = sortSessionsChronologically(history);
  const previousSession = sorted.at(-1);

  const sessionsToday = countSessionsOnCalendarDay(sorted, now);
  const consecutiveTrainingSessions =
    getConsecutiveTrainingSessionCount(sorted);

  if (!previousSession || previousSession.dayIndex == null) {
    return {
      status: "training-available",
      canTrain: true,
      reason: "normal-training",
      restDaysCompleted: 0,
      consecutiveTrainingSessions,
      sessionsToday,
    };
  }

  const recommendedRestDays = getRecommendedRestSlotsBetween(
    cycle,
    previousSession.dayIndex,
    currentDayIndex,
  );

  const actualRestDays = countFullRestDaysBetween(
    previousSession.completedAt,
    now,
  );

  /**
   * Even when the program cycle allows two training days back-to-back,
   * that means consecutive calendar days, not two normal workouts on the
   * same calendar day without Coach guidance.
   *
   * Example:
   * Day 1 Monday -> Day 2 Tuesday = normal
   * Day 1 Monday -> Day 2 Monday  = recovery recommended, override allowed
   *
   * Planned rest slots still take precedence when they require more
   * recovery.
   */
  const isSameDayAttempt = isSameCalendarDay(previousSession.completedAt, now);

  const effectiveRecommendedRestDays = Math.max(
    recommendedRestDays,
    isSameDayAttempt ? 1 : 0,
  );

  const shouldRecommendRest =
    config.normalRecoveryGuidanceEnabled &&
    effectiveRecommendedRestDays > actualRestDays;

  return {
    status: shouldRecommendRest ? "rest-recommended" : "training-available",

    // Normal recovery guidance never hard-locks training.
    canTrain: true,

    reason: shouldRecommendRest ? "normal-rest-recommended" : "normal-training",

    restDaysCompleted: actualRestDays,

   minimumRestDaysRequired: shouldRecommendRest
  ? effectiveRecommendedRestDays
  : undefined,

    consecutiveTrainingSessions,
    sessionsToday,
  };
}

/**
 * Pain recovery uses mandatory MINIMUM spacing.
 *
 * The same evaluator can be used:
 * - immediately after a pain trigger before Recovery Day 1
 * - between pain-recovery sessions
 *
 * Additional rest is always allowed.
 */
export function evaluatePainRecoverySchedule(args: {
  referenceTimestamp: string;
  history?: TimestampedTrainingSession[];
  now?: Date;
  isFirstRecoverySession?: boolean;
  config?: Partial<TrainingScheduleConfig>;
}): TrainingScheduleStatus {
  const {
    referenceTimestamp,
    history = [],
    now = new Date(),
    isFirstRecoverySession = false,
    config: suppliedConfig = DEFAULT_TRAINING_SCHEDULE_CONFIG,
  } = args;

  const config = normalizeTrainingScheduleConfig(suppliedConfig);

  const restDaysCompleted = countFullRestDaysBetween(referenceTimestamp, now);

  const nextEligibleDate = addEligibleDateAfterFullRestDays(
    referenceTimestamp,
    config.painMinimumRestDays,
  );

  const isEligible =
    startOfLocalDay(now).getTime() >=
    startOfLocalDay(nextEligibleDate).getTime();

  return {
    status: isEligible ? "training-available" : "rest-required",

    canTrain: isEligible,

    reason: isEligible
      ? "normal-training"
      : isFirstRecoverySession
        ? "pain-initial-rest"
        : "pain-recovery-spacing",

    nextEligibleDate: isEligible ? undefined : toLocalDateKey(nextEligibleDate),

    restDaysCompleted,

    minimumRestDaysRequired: config.painMinimumRestDays,

    consecutiveTrainingSessions: getConsecutiveTrainingSessionCount(history),

    sessionsToday: countSessionsOnCalendarDay(history, now),
  };
}

import { programs } from "@/data/programs";
import {
  evaluateNormalTrainingSchedule,
  evaluatePainRecoverySchedule,
} from "@/engine/TrainingScheduleEngine";
import { ActiveDeload } from "@/models/ProgramProgress";
import {
  TrainingScheduleStatus,
} from "@/models/TrainingSchedule";
import { CompletedSession, TrainingMode } from "@/models/WorkoutLog";
import { WorkoutStatus } from "@/models/WorkoutStatus";
import { loadProgress, saveProgress } from "@/storage/progressStorage";
import { saveWorkoutSession } from "@/storage/workoutStorage";
import { directCoachingScenarios } from "@/tests/coachingScenarios";
import { TrainingScheduleScenario } from "@/tests/trainingScheduleScenarios";
import {
  resetCoachingTestData,
  seedDirectCoachingScenario,
} from "@/utils/testing/CoachingScenarioSeeder";

export type TrainingScheduleSeedResult = {
  scenarioId: string;
  programId: string;
  targetWeek: number;
  targetDay: number;
  expectedStatus: string;
  expectedCanTrain: boolean;
  actualStatus: string;
  actualCanTrain: boolean;
  restDaysCompleted: number;
  minimumRestDaysRequired?: number;
  nextEligibleDate?: string;
  expectedConsecutiveTrainingSessions?: number;
  actualConsecutiveTrainingSessions: number;
  expectedSessionsToday?: number;
  actualSessionsToday: number;
};

function localDateDaysAgo(daysAgo: number, hour = 12): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Returns a timestamp on TODAY, safely at-or-before the current time.
 *
 * This avoids a flaky same-day regression test if it is run early in the
 * morning. Even at 00:00 both generated sessions still belong to today.
 */
function localTimeTodayMinutesAgo(minutesAgo: number): Date {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const safeMinutesAgo = Math.min(minutesAgo, minutesSinceMidnight);

  return new Date(now.getTime() - safeMinutesAgo * 60 * 1000);
}

function createMinimalSession(args: {
  programId: string;
  dayId: string;
  weekIndex: number;
  dayIndex: number;
  completedAt: Date;
  trainingMode?: TrainingMode;
  painRecovery?: boolean;
}): CompletedSession {
  const {
    programId,
    dayId,
    weekIndex,
    dayIndex,
    completedAt,
    trainingMode = "normal",
    painRecovery = false,
  } = args;

  const endWorkoutTime = completedAt.getTime();
  const workoutDuration = painRecovery ? 20 * 60 : 30 * 60;
  const startWorkoutTime = endWorkoutTime - workoutDuration * 1000;

  return {
    programId,
    dayId,
    weekIndex,
    dayIndex,
    status: WorkoutStatus.Completed,
    completedAt: completedAt.toISOString(),
    startWorkoutTime,
    endWorkoutTime,
    workoutDuration,
    timeUnderTension: 0,
    exercises: [],
    feedback: {
      rating: 3,
      tags: [],
      comment: painRecovery
        ? "Phase 5.7 scheduling test pain recovery"
        : "Phase 5.7 scheduling test normal workout",
    },
    warmup: {
      completed: ["seeded"],
      skipped: [],
      sectionSkipped: false,
    },
    stretch: {
      completed: ["seeded"],
      skipped: [],
      sectionSkipped: false,
    },
    sectionSkipped: painRecovery,
    trainingMode,
    ...(painRecovery
      ? {
          deload: {
            reason: "pain" as const,
            phase: "deload" as const,
            targetScale: 0,
          },
          recoveryActivity: {
            type: "guided-mobility" as const,
            completed: true,
          },
        }
      : {}),
  };
}

function assertScenarioExpectation(
  scenario: TrainingScheduleScenario,
  actual: TrainingScheduleStatus,
) {
  const expected = scenario.expected;
  const failures: string[] = [];

  if (actual.status !== expected.status) {
    failures.push(`status expected ${expected.status}, got ${actual.status}`);
  }

  if (actual.canTrain !== expected.canTrain) {
    failures.push(
      `canTrain expected ${expected.canTrain}, got ${actual.canTrain}`,
    );
  }

  if (actual.restDaysCompleted !== expected.restDaysCompleted) {
    failures.push(
      `restDaysCompleted expected ${expected.restDaysCompleted}, got ${actual.restDaysCompleted}`,
    );
  }

  if (
    expected.minimumRestDaysRequired != null &&
    actual.minimumRestDaysRequired !== expected.minimumRestDaysRequired
  ) {
    failures.push(
      `minimumRestDaysRequired expected ${expected.minimumRestDaysRequired}, got ${actual.minimumRestDaysRequired}`,
    );
  }

  if (
    expected.consecutiveTrainingSessions != null &&
    actual.consecutiveTrainingSessions !== expected.consecutiveTrainingSessions
  ) {
    failures.push(
      `consecutiveTrainingSessions expected ${expected.consecutiveTrainingSessions}, got ${actual.consecutiveTrainingSessions}`,
    );
  }

  if (
    expected.sessionsToday != null &&
    actual.sessionsToday !== expected.sessionsToday
  ) {
    failures.push(
      `sessionsToday expected ${expected.sessionsToday}, got ${actual.sessionsToday}`,
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Training schedule scenario ${scenario.id} failed: ${failures.join("; ")}`,
    );
  }
}

function toSeedResult(args: {
  scenario: TrainingScheduleScenario;
  programId: string;
  targetWeek: number;
  targetDay: number;
  actual: TrainingScheduleStatus;
}): TrainingScheduleSeedResult {
  const {
    scenario,
    programId,
    targetWeek,
    targetDay,
    actual,
  } = args;

  return {
    scenarioId: scenario.id,
    programId,
    targetWeek,
    targetDay,
    expectedStatus: scenario.expected.status,
    expectedCanTrain: scenario.expected.canTrain,
    actualStatus: actual.status,
    actualCanTrain: actual.canTrain,
    restDaysCompleted: actual.restDaysCompleted,
    minimumRestDaysRequired: actual.minimumRestDaysRequired,
    nextEligibleDate: actual.nextEligibleDate,
    expectedConsecutiveTrainingSessions:
      scenario.expected.consecutiveTrainingSessions,
    actualConsecutiveTrainingSessions:
      actual.consecutiveTrainingSessions,
    expectedSessionsToday: scenario.expected.sessionsToday,
    actualSessionsToday: actual.sessionsToday,
  };
}

async function seedNormalScenario(args: {
  scenario: TrainingScheduleScenario;
  programIndex: number;
}) {
  const { scenario, programIndex } = args;
  const program = programs[programIndex];

  await resetCoachingTestData();

  const firstDay = program.days[0];
  const secondDay = program.days[1];
  const thirdDay = program.days[2];

  if (!firstDay || !secondDay || !thirdDay) {
    throw new Error(
      "Normal scheduling tests require at least three workout days.",
    );
  }

  let day1CompletedAt: Date;
  let day2CompletedAt: Date;

  switch (scenario.kind) {
    case "normal-same-day":
      day1CompletedAt = localTimeTodayMinutesAgo(10);
      day2CompletedAt = localTimeTodayMinutesAgo(5);
      break;

    case "normal-long-gap":
      day1CompletedAt = localDateDaysAgo(7, 18);
      day2CompletedAt = localDateDaysAgo(4, 18);
      break;

    case "normal-advisory":
    default:
      day1CompletedAt = localDateDaysAgo(1, 18);
      day2CompletedAt = localTimeTodayMinutesAgo(5);
      break;
  }

  const day1Session = createMinimalSession({
    programId: program.id,
    dayId: firstDay.id,
    weekIndex: 0,
    dayIndex: 0,
    completedAt: day1CompletedAt,
  });

  const day2Session = createMinimalSession({
    programId: program.id,
    dayId: secondDay.id,
    weekIndex: 0,
    dayIndex: 1,
    completedAt: day2CompletedAt,
  });

  const history = [day1Session, day2Session];

  await saveWorkoutSession(day1Session);
  await saveWorkoutSession(day2Session);

  await saveProgress({
    programIndex,
    week: 0,
    day: 2,
    workouts: {
      [`${programIndex}-0-0`]: {
        completedSets: 0,
        totalSets: 0,
        completed: true,
      },
      [`${programIndex}-0-1`]: {
        completedSets: 0,
        totalSets: 0,
        completed: true,
      },
    },
    pendingGraduation: null,
    activeDeload: null,
  });

  const actual = evaluateNormalTrainingSchedule({
    cycle: program.recommendedCycle,
    currentDayIndex: 2,
    history,
    now: new Date(),
  });

  assertScenarioExpectation(scenario, actual);

  console.log("🗓️ NORMAL TRAINING SCHEDULE SCENARIO SEEDED", {
    scenario: scenario.id,
    currentDayIndex: 2,
    history: history.map((session) => ({
      weekIndex: session.weekIndex,
      dayIndex: session.dayIndex,
      completedAt: session.completedAt,
    })),
    expected: scenario.expected,
    actual,
  });

  return toSeedResult({
    scenario,
    programId: program.id,
    targetWeek: 1,
    targetDay: 3,
    actual,
  });
}

export async function seedTrainingScheduleScenario(
  scenario: TrainingScheduleScenario,
  programId: string = "level1",
): Promise<TrainingScheduleSeedResult> {
  const programIndex = programs.findIndex(
    (program) => program.id === programId,
  );

  if (programIndex < 0) {
    throw new Error(
      `TrainingScheduleScenarioSeeder: program "${programId}" not found`,
    );
  }

  if (
    scenario.kind === "normal-advisory" ||
    scenario.kind === "normal-same-day" ||
    scenario.kind === "normal-long-gap"
  ) {
    return seedNormalScenario({
      scenario,
      programIndex,
    });
  }

  const program = programs[programIndex];

  const basePainScenario = directCoachingScenarios.find(
    (candidate) => candidate.id === "pain-deload-direct",
  );

  if (!basePainScenario) {
    throw new Error("Direct pain-deload coaching scenario was not found.");
  }

  await seedDirectCoachingScenario(basePainScenario, programId);

  const progress = await loadProgress();

  if (!progress?.activeDeload) {
    throw new Error("Pain scheduling seed did not create an active deload.");
  }

  const deloadWeekIndex = progress.activeDeload.deloadWeekIndex;
  const activationDaysAgo = scenario.activationDaysAgo ?? 0;

  /**
   * Direct scheduling tests simulate the moment the user actually chose
   * to begin the Pain Recovery Cycle.
   *
   * Keep createdAt aligned as well for backward compatibility, but
   * recoveryStartedAt is the authoritative initial-rest timestamp.
   */
  const seededRecoveryStart = localDateDaysAgo(
    activationDaysAgo,
    18,
  ).toISOString();

  const activeDeload: ActiveDeload = {
    ...progress.activeDeload,
    reason: "pain",
    phase: "deload",
    createdAt: seededRecoveryStart,
    recoveryStartedAt: seededRecoveryStart,
  };

  let currentDayIndex = 0;
  const currentCyclePainHistory: CompletedSession[] = [];

  if (scenario.previousRecoveryDaysAgo != null) {
    const recoveryDay = program.days[0];

    if (!recoveryDay) {
      throw new Error("Program is missing Recovery Day 1 source day.");
    }

    const session = createMinimalSession({
      programId: program.id,
      dayId: recoveryDay.id,
      weekIndex: deloadWeekIndex,
      dayIndex: 0,
      completedAt: localDateDaysAgo(
        scenario.previousRecoveryDaysAgo,
        10,
      ),
      trainingMode: "deload-pain",
      painRecovery: true,
    });

    await saveWorkoutSession(session);
    currentCyclePainHistory.push(session);
    currentDayIndex = 1;

    progress.workouts[`${programIndex}-${deloadWeekIndex}-0`] = {
      completedSets: 0,
      totalSets: 0,
      completed: true,
    };
  }

  if (scenario.oldCycleRecoveryDaysAgo != null) {
    const oldDay = program.days[0];

    if (!oldDay) {
      throw new Error("Program is missing an old-cycle recovery source day.");
    }

    const oldSession = createMinimalSession({
      programId: program.id,
      dayId: oldDay.id,
      weekIndex: Math.max(0, deloadWeekIndex - 1),
      dayIndex: 0,
      completedAt: localDateDaysAgo(
        scenario.oldCycleRecoveryDaysAgo,
        10,
      ),
      trainingMode: "deload-pain",
      painRecovery: true,
    });

    await saveWorkoutSession(oldSession);
  }

  await saveProgress({
    ...progress,
    week: deloadWeekIndex,
    day: currentDayIndex,
    pendingGraduation: null,
    activeDeload,
  });

  const referenceTimestamp =
    currentCyclePainHistory.at(-1)?.completedAt ??
    activeDeload.recoveryStartedAt ??
    activeDeload.createdAt;

  const actual = evaluatePainRecoverySchedule({
    referenceTimestamp,
    history: currentCyclePainHistory,
    now: new Date(),
    isFirstRecoverySession: currentCyclePainHistory.length === 0,
  });

  assertScenarioExpectation(scenario, actual);

  console.log("🗓️ PAIN TRAINING SCHEDULE SCENARIO SEEDED", {
    scenario: scenario.id,
    currentDayIndex,
    activeDeload,
    currentCyclePainHistory: currentCyclePainHistory.map((session) => ({
      weekIndex: session.weekIndex,
      dayIndex: session.dayIndex,
      completedAt: session.completedAt,
    })),
    expected: scenario.expected,
    actual,
  });

  return toSeedResult({
    scenario,
    programId: program.id,
    targetWeek: deloadWeekIndex + 1,
    targetDay: currentDayIndex + 1,
    actual,
  });
}

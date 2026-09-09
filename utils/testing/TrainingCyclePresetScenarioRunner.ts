import { programs } from "@/data/programs";
import {
  getTrainingCycleForPreset,
} from "@/data/recommendedTrainingCycles";
import {
  evaluateNormalTrainingSchedule,
  getRecommendedRestSlotsBetween,
} from "@/engine/TrainingScheduleEngine";
import { TrainingCyclePresetId } from "@/config/TrainingScheduleConfig";
import { TimestampedTrainingSession } from "@/models/TrainingSchedule";

export type TrainingCyclePresetAssertionResult = {
  id: string;
  message: string;
};

function assertEqual<T>(
  label: string,
  actual: T,
  expected: T,
): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function localDateDaysAgo(daysAgo: number, hour = 12): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function resolveCycle(programId: string, presetId: TrainingCyclePresetId) {
  const program = programs.find((candidate) => candidate.id === programId);

  if (!program) {
    throw new Error(`Program ${programId} not found`);
  }

  return {
    program,
    cycle: getTrainingCycleForPreset({
      presetId,
      programDefaultCycle: program.recommendedCycle,
      programDayCount: program.days.length,
    }),
  };
}

function singlePreviousSession(
  dayIndex: number,
  completedAt: Date,
): TimestampedTrainingSession[] {
  return [
    {
      dayIndex,
      completedAt: completedAt.toISOString(),
      trainingMode: "normal",
    },
  ];
}

export function runTrainingCyclePresetAssertions(): TrainingCyclePresetAssertionResult[] {
  const passed: TrainingCyclePresetAssertionResult[] = [];

  // 1. Recommended must remain the program's own configured cycle.
  {
    const { program, cycle } = resolveCycle("level1", "recommended");

    if (cycle !== program.recommendedCycle) {
      throw new Error(
        "4-day recommended preset did not return the program default cycle",
      );
    }

    passed.push({
      id: "four-day-recommended-default",
      message: "4-day Program Recommended uses the program default cycle.",
    });
  }

  // 2. 4-day Balanced Recovery:
  // D1 → D2 → R → D3 → R → D4 → R → R
  {
    const { cycle } = resolveCycle("level1", "balanced-recovery");

    assertEqual("4-day balanced slot count", cycle.slots.length, 8);
    assertEqual(
      "4-day balanced D2 -> D3 rest",
      getRecommendedRestSlotsBetween(cycle, 1, 2),
      1,
    );
    assertEqual(
      "4-day balanced D3 -> D4 rest",
      getRecommendedRestSlotsBetween(cycle, 2, 3),
      1,
    );
    assertEqual(
      "4-day balanced D4 -> next D1 rest",
      getRecommendedRestSlotsBetween(cycle, 3, 0),
      2,
    );

    passed.push({
      id: "four-day-balanced-spacing",
      message:
        "4-day Balanced Recovery resolves to 8 slots and preserves 1/1/2 planned rest spacing.",
    });
  }

  // 3. 4-day Extra Flexibility:
  // D1 → D2 → R → R → D3 → R → R → D4 → R
  {
    const { cycle } = resolveCycle("level1", "extra-flexibility");

    assertEqual("4-day flexible slot count", cycle.slots.length, 9);
    assertEqual(
      "4-day flexible D2 -> D3 rest",
      getRecommendedRestSlotsBetween(cycle, 1, 2),
      2,
    );
    assertEqual(
      "4-day flexible D3 -> D4 rest",
      getRecommendedRestSlotsBetween(cycle, 2, 3),
      2,
    );
    assertEqual(
      "4-day flexible D4 -> next D1 rest",
      getRecommendedRestSlotsBetween(cycle, 3, 0),
      1,
    );

    passed.push({
      id: "four-day-flexible-spacing",
      message:
        "4-day Extra Flexibility resolves to 9 slots and preserves 2/2/1 planned rest spacing.",
    });
  }

  // 4. 5-day Balanced Recovery:
  // D1 → D2 → R → D3 → D4 → R → D5 → R
  {
    const { cycle } = resolveCycle("level3", "balanced-recovery");

    assertEqual("5-day balanced slot count", cycle.slots.length, 8);
    assertEqual(
      "5-day balanced D2 -> D3 rest",
      getRecommendedRestSlotsBetween(cycle, 1, 2),
      1,
    );
    assertEqual(
      "5-day balanced D4 -> D5 rest",
      getRecommendedRestSlotsBetween(cycle, 3, 4),
      1,
    );
    assertEqual(
      "5-day balanced D5 -> next D1 rest",
      getRecommendedRestSlotsBetween(cycle, 4, 0),
      1,
    );

    passed.push({
      id: "five-day-balanced-spacing",
      message:
        "5-day Balanced Recovery resolves to 8 slots and preserves 1/1/1 key recovery spacing.",
    });
  }

  // 5. 5-day Extra Flexibility:
  // D1 → D2 → R → R → D3 → R → D4 → D5 → R
  {
    const { cycle } = resolveCycle("level3", "extra-flexibility");

    assertEqual("5-day flexible slot count", cycle.slots.length, 9);
    assertEqual(
      "5-day flexible D2 -> D3 rest",
      getRecommendedRestSlotsBetween(cycle, 1, 2),
      2,
    );
    assertEqual(
      "5-day flexible D3 -> D4 rest",
      getRecommendedRestSlotsBetween(cycle, 2, 3),
      1,
    );
    assertEqual(
      "5-day flexible D5 -> next D1 rest",
      getRecommendedRestSlotsBetween(cycle, 4, 0),
      1,
    );

    passed.push({
      id: "five-day-flexible-spacing",
      message:
        "5-day Extra Flexibility resolves to 9 slots and preserves 2/1/1 key recovery spacing.",
    });
  }

  // 6. Actual engine behavior: insufficient recovery remains advisory.
  {
    const { cycle } = resolveCycle("level1", "extra-flexibility");
    const now = new Date();

    const actual = evaluateNormalTrainingSchedule({
      cycle,
      currentDayIndex: 2,
      history: singlePreviousSession(1, localDateDaysAgo(1, 18)),
      now,
    });

    assertEqual("advisory status", actual.status, "rest-recommended");
    assertEqual("advisory canTrain", actual.canTrain, true);
    assertEqual("advisory required rest", actual.minimumRestDaysRequired, 2);
    assertEqual("advisory actual rest", actual.restDaysCompleted, 0);

    passed.push({
      id: "extra-flexibility-advisory",
      message:
        "Extra Flexibility recommends 2 full rest days before D3 but still allows training when recovery is short.",
    });
  }

  // 7. Actual engine behavior: enough recovery clears the recommendation.
  {
    const { cycle } = resolveCycle("level3", "balanced-recovery");
    const now = new Date();

    const actual = evaluateNormalTrainingSchedule({
      cycle,
      currentDayIndex: 2,
      history: singlePreviousSession(1, localDateDaysAgo(2, 18)),
      now,
    });

    assertEqual("available status", actual.status, "training-available");
    assertEqual("available canTrain", actual.canTrain, true);
    assertEqual("available actual rest", actual.restDaysCompleted, 1);
    assertEqual(
      "available minimum rest omitted",
      actual.minimumRestDaysRequired,
      undefined,
    );

    passed.push({
      id: "balanced-recovery-satisfied",
      message:
        "5-day Balanced Recovery makes D3 available once its planned full rest day has been completed.",
    });
  }

  return passed;
}

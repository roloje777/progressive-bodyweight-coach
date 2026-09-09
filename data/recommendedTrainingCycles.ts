import { TrainingCyclePresetId } from "../config/TrainingScheduleConfig";
import { RecommendedTrainingCycle } from "../models/Program";

export type TrainingCyclePresetOption = {
  id: TrainingCyclePresetId;
  name: string;
  description: string;
};

/**
 * Advisory cycle:
 * D1 → D2 → R → D3 → D4 → R → R
 *
 * Rest slots are recommendations for normal training, not hard locks.
 */
export const FOUR_DAY_RECOMMENDED_CYCLE: RecommendedTrainingCycle = {
  slots: [
    { type: "training", dayIndex: 0 },
    { type: "training", dayIndex: 1 },
    { type: "rest" },
    { type: "training", dayIndex: 2 },
    { type: "training", dayIndex: 3 },
    { type: "rest" },
    { type: "rest" },
  ],
};

/**
 * Advisory cycle:
 * D1 → D2 → D3 → R → D4 → D5 → R
 *
 * Rest slots are recommendations for normal training, not hard locks.
 */
export const FIVE_DAY_RECOMMENDED_CYCLE: RecommendedTrainingCycle = {
  slots: [
    { type: "training", dayIndex: 0 },
    { type: "training", dayIndex: 1 },
    { type: "training", dayIndex: 2 },
    { type: "rest" },
    { type: "training", dayIndex: 3 },
    { type: "training", dayIndex: 4 },
    { type: "rest" },
  ],
};

/**
 * 4 workouts across 8 advisory slots:
 * D1 → D2 → R → D3 → R → D4 → R → R
 */
export const FOUR_DAY_BALANCED_RECOVERY_CYCLE: RecommendedTrainingCycle = {
  slots: [
    { type: "training", dayIndex: 0 },
    { type: "training", dayIndex: 1 },
    { type: "rest" },
    { type: "training", dayIndex: 2 },
    { type: "rest" },
    { type: "training", dayIndex: 3 },
    { type: "rest" },
    { type: "rest" },
  ],
};

/**
 * 4 workouts across 9 advisory slots:
 * D1 → D2 → R → R → D3 → R → R → D4 → R
 *
 * Useful when two weekend sessions plus one midweek session make a
 * seven-day completion target unrealistic.
 */
export const FOUR_DAY_EXTRA_FLEXIBILITY_CYCLE: RecommendedTrainingCycle = {
  slots: [
    { type: "training", dayIndex: 0 },
    { type: "training", dayIndex: 1 },
    { type: "rest" },
    { type: "rest" },
    { type: "training", dayIndex: 2 },
    { type: "rest" },
    { type: "rest" },
    { type: "training", dayIndex: 3 },
    { type: "rest" },
  ],
};

/**
 * 5 workouts across 8 advisory slots:
 * D1 → D2 → R → D3 → D4 → R → D5 → R
 */
export const FIVE_DAY_BALANCED_RECOVERY_CYCLE: RecommendedTrainingCycle = {
  slots: [
    { type: "training", dayIndex: 0 },
    { type: "training", dayIndex: 1 },
    { type: "rest" },
    { type: "training", dayIndex: 2 },
    { type: "training", dayIndex: 3 },
    { type: "rest" },
    { type: "training", dayIndex: 4 },
    { type: "rest" },
  ],
};

/**
 * 5 workouts across 9 advisory slots:
 * D1 → D2 → R → R → D3 → R → D4 → D5 → R
 */
export const FIVE_DAY_EXTRA_FLEXIBILITY_CYCLE: RecommendedTrainingCycle = {
  slots: [
    { type: "training", dayIndex: 0 },
    { type: "training", dayIndex: 1 },
    { type: "rest" },
    { type: "rest" },
    { type: "training", dayIndex: 2 },
    { type: "rest" },
    { type: "training", dayIndex: 3 },
    { type: "training", dayIndex: 4 },
    { type: "rest" },
  ],
};

export const TRAINING_CYCLE_PRESET_OPTIONS: TrainingCyclePresetOption[] = [
  {
    id: "recommended",
    name: "Program Recommended",
    description: "Uses the default recovery pattern designed for the active program.",
  },
  {
    id: "balanced-recovery",
    name: "Balanced Recovery",
    description: "Spreads the same workouts across 8 slots with additional recovery.",
  },
  {
    id: "extra-flexibility",
    name: "Extra Flexibility",
    description: "Spreads the same workouts across 9 slots for a less compressed schedule.",
  },
];

export function getTrainingCycleForPreset(input: {
  presetId: TrainingCyclePresetId;
  programDefaultCycle: RecommendedTrainingCycle;
  programDayCount: number;
}): RecommendedTrainingCycle {
  const { presetId, programDefaultCycle, programDayCount } = input;

  if (presetId === "recommended") {
    return programDefaultCycle;
  }

  if (programDayCount === 4) {
    return presetId === "balanced-recovery"
      ? FOUR_DAY_BALANCED_RECOVERY_CYCLE
      : FOUR_DAY_EXTRA_FLEXIBILITY_CYCLE;
  }

  if (programDayCount === 5) {
    return presetId === "balanced-recovery"
      ? FIVE_DAY_BALANCED_RECOVERY_CYCLE
      : FIVE_DAY_EXTRA_FLEXIBILITY_CYCLE;
  }

  // Future program sizes remain safe: unsupported alternatives fall back
  // to the program's own recommendation rather than applying a bad preset.
  return programDefaultCycle;
}

export function formatTrainingCycle(
  cycle: RecommendedTrainingCycle,
): string {
  return cycle.slots
    .map((slot) =>
      slot.type === "training" ? `D${slot.dayIndex + 1}` : "Rest",
    )
    .join(" • ");
}

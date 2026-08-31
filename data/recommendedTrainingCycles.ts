import { RecommendedTrainingCycle } from "../models/Program";

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

import { ProgressionTree } from "../models/Graduation";

export const pushProgressionTree: ProgressionTree = {
  id: "push-tree",

  category: "push",

  root: "wall-push-up",

  nodes: {
    "wall-push-up": {
      id: "wall-push-up",
      exerciseId: "wall-push-up",
      tier: 1,
      next: ["incline-push-up"],
    },

    "incline-push-up": {
      id: "incline-push-up",
      exerciseId: "incline-push-up",
      tier: 2,
      next: ["knee-push-up"],
      regressions: ["wall-push-up"],
    },

    "knee-push-up": {
      id: "knee-push-up",
      exerciseId: "knee-push-up",
      tier: 3,
      next: ["push-up"],
      regressions: ["incline-push-up"],
    },

    "push-up": {
      id: "push-up",
      exerciseId: "push-up",
};
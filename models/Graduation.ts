export type DifficultyTier =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

export interface ProgressionNode {
  id: string;

  exerciseId: string;

  tier: DifficultyTier;

  next?: string[];

  regressions?: string[];

  tags?: string[];

  unlockRequirements?: {
    workoutsCompleted?: number;
    minRating?: number;
    consistencyScore?: number;
    minPerformanceScore?: number;
  };
}

export interface ProgressionTree {
  id: string;

  category:
    | "push"
    | "pull"
    | "legs"
    | "core"
    | "skill";

  root: string;

  nodes: Record<string, ProgressionNode>;
}
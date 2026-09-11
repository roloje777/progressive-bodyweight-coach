import { CompletedSet, CompletedSession } from "@/models/WorkoutLog";

export function getComparableSetValues(
  history: CompletedSession[],
  exerciseId: string,
  setNumber: number,
): number[] {
  const values: number[] = [];
  for (let i = history.length - 1; i >= 0 && values.length < 3; i--) {
    const exercise = history[i].exercises.find((e) => e.exerciseId === exerciseId);
    const set = exercise?.sets.find((s) => s.setNumber === setNumber && s.status === "completed");
    if (!set) continue;
    const value = getComparableSetValue(set);
    if (value != null) values.push(value);
  }
  return values;
}

export function getComparableSetValue(set: CompletedSet): number | null {
  if (typeof set.repsCompleted === "number") return set.repsCompleted;
  if (typeof set.repsLeft === "number" && typeof set.repsRight === "number") {
    return (set.repsLeft + set.repsRight) / 2;
  }
  if (typeof set.durationSeconds === "number") return set.durationSeconds;
  if (typeof set.durationLeft === "number" && typeof set.durationRight === "number") {
    return (set.durationLeft + set.durationRight) / 2;
  }
  return null;
}

export function isUnusualRecoveryValue(input: {
  value: number;
  historyValues: number[];
  matchOrBeatTarget?: number | null;
}): boolean {
  const references = [
    ...input.historyValues,
    ...(input.matchOrBeatTarget != null ? [input.matchOrBeatTarget] : []),
  ].filter((v) => Number.isFinite(v) && v > 0);
  if (!references.length) return false;
  const sorted = [...references].sort((a, b) => a - b);
  const baseline = sorted[Math.floor(sorted.length / 2)];
  // Relative advisory threshold: large proportional jumps deserve confirmation.
  // This deliberately warns rather than blocks.
  return input.value >= baseline * 1.35 && input.value - baseline >= 2;
}

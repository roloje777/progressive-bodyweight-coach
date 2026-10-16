/** Persist the exact retry identity and UTC deadline; never derive from day-of-week. */
export type RetryRecoveryLock = Readonly<{
  programId: string; weekIndex: number; dayIndex: number;
  startedAt: number; unlockAt: number;
}>;
export function createRetryRecoveryLock(input: {
  programId: string; weekIndex: number; dayIndex: number;
  now: number; hours: 12 | 24 | 48;
}): RetryRecoveryLock {
  if (!input.programId || !Number.isSafeInteger(input.weekIndex) || input.weekIndex < 0 ||
      !Number.isSafeInteger(input.dayIndex) || input.dayIndex < 0 ||
      !Number.isFinite(input.now) || input.now <= 0 || ![12,24,48].includes(input.hours))
    throw new Error("Invalid retry recovery identity or duration");
  return Object.freeze({programId: input.programId, weekIndex: input.weekIndex,
    dayIndex: input.dayIndex, startedAt: input.now,
    unlockAt: input.now + input.hours * 60 * 60 * 1000});
}
export function isRetryLocked(lock: RetryRecoveryLock | null, current: {
  programId: string; weekIndex: number; dayIndex: number;
  now: number; enabled: boolean;
}): boolean {
  return !!lock && current.enabled && lock.programId === current.programId &&
    lock.weekIndex === current.weekIndex && lock.dayIndex === current.dayIndex &&
    Number.isFinite(current.now) && current.now < lock.unlockAt;
}

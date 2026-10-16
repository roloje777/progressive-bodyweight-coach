/** Local calendar-date recovery. Date keys are deliberately not UTC timestamps. */
export type CalendarRecovery = Readonly<{
  programId: string; weekIndex: number; dayIndex: number;
  sourceDay: string; recoveryDays: number; kind: "retry" | "extra";
}>;
export function localDateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
}
export function parseLocalDateKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y,m,d] = key.split("-").map(Number);
  const date = new Date(y,m-1,d);
  return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d ? date : null;
}
export function recoveryUnlockDate(sourceDay: string, days: number): string {
  const date = parseLocalDateKey(sourceDay);
  if (!date || !Number.isSafeInteger(days) || days < 0) throw new Error("Invalid recovery date or days");
  date.setDate(date.getDate() + days + 1);
  return localDateKey(date);
}
export function recoveryPending(recovery: CalendarRecovery | null, now: Date): boolean {
  if (!recovery) return false;
  return localDateKey(now) < recoveryUnlockDate(recovery.sourceDay, recovery.recoveryDays);
}
export function matchesRecovery(recovery: CalendarRecovery | null, current: {programId:string;weekIndex:number;dayIndex:number}): boolean {
  return !!recovery && recovery.programId === current.programId && recovery.weekIndex === current.weekIndex && recovery.dayIndex === current.dayIndex;
}

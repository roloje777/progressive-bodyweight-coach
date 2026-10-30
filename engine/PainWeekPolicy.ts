/** Phase 3O Pain Week policy. Pure functions; no navigation or storage side effects. */
export type PainWeekSymptoms = "resolved" | "improving" | "unchanged" | "worsening";
export type PainWeekAssessment = {
  episodeId: string;
  localDate: string; // YYYY-MM-DD in the user's local calendar
  recordedAt: string;
  painScore: number;
  symptoms: PainWeekSymptoms;
  movementLimited: boolean;
  severePain: boolean;
  warningSigns: boolean;
  readyForReducedTraining: boolean;
};
export type PainWeekDecision = "medical-recovery" | "continue-recovery" | "final-assessment-eligible";
export type PainWeekFinalAssessment = PainWeekAssessment & {
  earlyReturnAcknowledged: boolean;
};
export type PainWeekFinalDecision = "medical-recovery" | "continue-recovery" | "early-return-confirmation-required" | "ready-for-deload";

export function isPainWeekAssessment(a: unknown): a is PainWeekAssessment {
  if (!a || typeof a !== "object") return false;
  const v = a as Partial<PainWeekAssessment>;
  return typeof v.episodeId === "string" && v.episodeId.trim().length > 0 &&
    typeof v.localDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.localDate) &&
    typeof v.recordedAt === "string" && !Number.isNaN(Date.parse(v.recordedAt)) &&
    Number.isInteger(v.painScore) && (v.painScore as number) >= 0 && (v.painScore as number) <= 10 &&
    ["resolved", "improving", "unchanged", "worsening"].includes(v.symptoms ?? "") &&
    typeof v.movementLimited === "boolean" && typeof v.severePain === "boolean" &&
    typeof v.warningSigns === "boolean" && typeof v.readyForReducedTraining === "boolean";
}
export function assessPainWeek(a: PainWeekAssessment): PainWeekDecision {
  if (a.severePain || a.warningSigns || a.symptoms === "worsening") return "medical-recovery";
  if (a.painScore === 0 && a.symptoms === "resolved" && !a.movementLimited && a.readyForReducedTraining)
    return "final-assessment-eligible";
  return "continue-recovery";
}
/** Calendar day index: first day is 1; no time-of-day or DST arithmetic. */
export function painWeekDay(startDate: string, today: string): number {
  const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
  if (!valid(startDate) || !valid(today)) throw new Error("Invalid local calendar date");
  return Math.max(1, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1);
}
export function assessFinalPainWeek(a: PainWeekFinalAssessment, elapsedDays: number, recommendedDays: number): PainWeekFinalDecision {
  const decision = assessPainWeek(a);
  if (decision === "medical-recovery") return "medical-recovery";
  if (decision !== "final-assessment-eligible") return "continue-recovery";
  if (!Number.isInteger(elapsedDays) || elapsedDays < 1 || !Number.isInteger(recommendedDays) || recommendedDays < 1)
    return "continue-recovery";
  if (elapsedDays < recommendedDays && !a.earlyReturnAcknowledged) return "early-return-confirmation-required";
  return "ready-for-deload";
}

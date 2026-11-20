/** Pure, read-only aggregation. Never accept medical treatment or notes in the analytics model. */
import type { AbortAttempt, AbortReason, AbortStage } from "@/models/AbortAttempt";
import type { PainTriageRecord } from "@/storage/painTriageHistoryStorage";
import type { PainWeekEpisode } from "@/storage/painWeekStorage";

export type MedicalAnalyticsInput = Pick<import("@/engine/MedicalRecoveryPolicy").MedicalRecoveryAssessment,
  "episodeId" | "recordedAt" | "painScore" | "symptoms" | "medicalClearanceConfirmed" | "warningSigns">;
export type AnalyticsWindow = "all" | "30" | "90";
export type AnalyticsBucket = { key: string; count: number };
export type RecoveryAnalytics = {
  aborts: number;
  abortReasons: AnalyticsBucket[];
  abortStages: AnalyticsBucket[];
  averageAbortCompletion: number | null;
  triages: number;
  triageOutcomes: AnalyticsBucket[];
  painWeeks: number;
  painWeekStatuses: AnalyticsBucket[];
  dailyCheckIns: number;
  medicalAssessments: number;
  medicalEpisodes: number;
  medicalClearances: number;
  averageMedicalPain: number | null;
};
const asTime = (v: string | number): number => {
  const n = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(n) ? n : NaN;
};
const inWindow = (v: string | number, window: AnalyticsWindow, now: number): boolean => {
  const time = asTime(v);
  if (!Number.isFinite(time) || time > now) return false;
  return window === "all" || time >= now - Number(window) * 86400000;
};
const buckets = (values: string[], keys: readonly string[]): AnalyticsBucket[] =>
  keys.map(key => ({ key, count: values.filter(value => value === key).length }));
const mean = (values: number[]): number | null => values.length
  ? Math.round(values.reduce((sum, n) => sum + n, 0) / values.length * 10) / 10 : null;

export function buildRecoveryAnalytics(
  aborts: readonly AbortAttempt[],
  triages: readonly PainTriageRecord[],
  painWeeks: readonly PainWeekEpisode[],
  medical: readonly MedicalAnalyticsInput[],
  window: AnalyticsWindow = "all",
  now: number = Date.now(),
): RecoveryAnalytics {
  const a = aborts.filter(item => inWindow(item.recordedAt, window, now));
  const t = triages.filter(item => inWindow(item.recordedAt, window, now));
  // Episode-level statistics use episode START date; daily check-ins belong to that episode.
  const p = painWeeks.filter(item => inWindow(`${item.startedLocalDate}T12:00:00`, window, now));
  const m = medical.filter(item => inWindow(item.recordedAt, window, now));
  return {
    aborts: a.length,
    abortReasons: buckets(a.map(item => item.reason), ["pain", "fatigue", "unwell", "time", "commitment", "equipment", "technical", "emergency", "other"] satisfies AbortReason[]),
    abortStages: buckets(a.map(item => item.stage), ["dynamicWarmUp", "workout", "staticStretch"] satisfies AbortStage[]),
    averageAbortCompletion: mean(a.map(item => item.completionPercent).filter(n => Number.isFinite(n) && n >= 0 && n <= 100)),
    triages: t.length,
    triageOutcomes: buckets(t.map(item => item.outcome), ["continue", "pain-week", "medical-recovery"]),
    painWeeks: p.length,
    painWeekStatuses: buckets(p.map(item => item.status), ["active", "completed", "medical-recovery"]),
    dailyCheckIns: p.reduce((sum, item) => sum + item.dailyAssessments.length, 0),
    medicalAssessments: m.length,
    medicalEpisodes: new Set(m.map(item => item.episodeId)).size,
    medicalClearances: m.filter(item => item.medicalClearanceConfirmed).length,
    averageMedicalPain: mean(m.map(item => item.painScore).filter(n => Number.isFinite(n) && n >= 0 && n <= 10)),
  };
}

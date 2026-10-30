/** Phase 3O: conservative return-to-training decision, not medical clearance. */
export type MedicalRecoveryAssessment = {
  episodeId: string;
  recordedAt: string;
  consultationDate?: string;
  treatment: string;
  daysAway: number | null;
  notes: string;
  symptoms: "resolved" | "improving" | "unchanged" | "worsening";
  painScore: number;
  medicalClearanceConfirmed: boolean;
  restrictionsAcknowledged: boolean;
  warningSigns: boolean;
};
export type MedicalRecoveryDecision = "medical-recovery" | "ready-for-deload";
export function assessMedicalRecovery(a: MedicalRecoveryAssessment): MedicalRecoveryDecision {
  if (!a.medicalClearanceConfirmed || !a.restrictionsAcknowledged || a.warningSigns ||
      a.symptoms !== "resolved" || a.painScore !== 0 ||
      !Number.isInteger(a.daysAway) || (a.daysAway ?? -1) < 0 ||
      !a.treatment.trim()) return "medical-recovery";
  return "ready-for-deload";
}
export function isMedicalRecoveryAssessment(v: unknown): v is MedicalRecoveryAssessment {
  if (!v || typeof v !== "object") return false;
  const a = v as Partial<MedicalRecoveryAssessment>;
  return typeof a.episodeId === "string" && a.episodeId.length > 0 &&
    typeof a.recordedAt === "string" && typeof a.treatment === "string" &&
    typeof a.notes === "string" &&
    (a.daysAway === null || (Number.isInteger(a.daysAway) && (a.daysAway as number) >= 0)) &&
    ["resolved", "improving", "unchanged", "worsening"].includes(a.symptoms ?? "") &&
    typeof a.painScore === "number" && Number.isInteger(a.painScore) && a.painScore >= 0 && a.painScore <= 10 &&
    typeof a.medicalClearanceConfirmed === "boolean" &&
    typeof a.restrictionsAcknowledged === "boolean" && typeof a.warningSigns === "boolean";
}

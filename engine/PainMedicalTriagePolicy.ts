/** Conservative user-reported triage, not a diagnosis. */
export type PainMedicalTriage = { severePain: boolean | null; worseningPain: boolean | null; warningSigns: boolean | null };
export function requiresMedicalRecovery(a: PainMedicalTriage): boolean {
  return a.severePain === true || a.worseningPain === true || a.warningSigns === true;
}

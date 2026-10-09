import { AbortReason, AbortStage } from "@/models/AbortAttempt";

const reasons: Record<AbortReason, [string, string]> = {
  emergency: ["Emergency", "Emergência"],
  unwell: ["Not feeling well", "Não me sentia bem"],
  commitment: ["Unexpected commitment", "Compromisso inesperado"],
  time: ["Ran out of time", "Falta de tempo"],
  fatigue: ["Too fatigued", "Demasiado cansado"],
  equipment: ["Equipment or environment", "Equipamento ou ambiente"],
  technical: ["Technical issue", "Problema técnico"],
  other: ["Other reason", "Outro motivo"],
  pain: ["Pain reported", "Dor comunicada"],
};
const stages: Record<AbortStage, [string, string]> = {
  dynamicWarmUp: ["Dynamic warm-up", "Aquecimento dinâmico"],
  workout: ["Main workout", "Treino principal"],
  staticStretch: ["Static stretching", "Alongamentos estáticos"],
};
export function abortReasonLabel(reason: AbortReason, language: string): string {
  return (reasons[reason] ?? [reason, reason])[language === "pt-PT" ? 1 : 0];
}
export function abortStageLabel(stage: AbortStage, language: string): string {
  return (stages[stage] ?? [stage, stage])[language === "pt-PT" ? 1 : 0];
}

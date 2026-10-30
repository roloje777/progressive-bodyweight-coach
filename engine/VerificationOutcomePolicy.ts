/** A Verification attempt never advances ordinary program progression. */
export type VerificationDecision =
  | { outcome: "pass"; recoveryDays: 0 }
  | { outcome: "retry"; recoveryDays: 1 | 2 }
  | { outcome: "pain"; recoveryDays: null };

export function evaluateVerificationAttempt(input: {
  eligibleTargets: number;
  metTargets: number;
  rating: number | null;
  painBlocker: boolean;
  otherRecoveryBlocker: boolean;
  prescriptionAvailable: boolean;
}): VerificationDecision {
  if (input.painBlocker) return { outcome: "pain", recoveryDays: null };
  const score = input.eligibleTargets > 0
    ? input.metTargets / input.eligibleTargets : 0;
  if (input.prescriptionAvailable && !input.otherRecoveryBlocker &&
      score >= 0.8 && input.rating != null && input.rating >= 3 && input.rating <= 5) {
    return { outcome: "pass", recoveryDays: 0 };
  }
  // Missing evidence is never an automatic pass. Unknown ratings fail closed.
  return { outcome: "retry", recoveryDays: score < 0.8 || input.rating == null ? 2 : 1 };
}

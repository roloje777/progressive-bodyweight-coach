import React from "react";
import { usePathname, useRouter } from "expo-router";
import { prepareActiveWorkoutForRuntime } from "@/storage/activeWorkoutStorage";
import { useWorkoutRecoverySettings } from "@/hooks/useWorkoutRecoverySettings";

export default function WorkoutRecoveryGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { workoutRecoveryConfig, isLoaded } = useWorkoutRecoverySettings();
  const checked = React.useRef(false);

  React.useEffect(() => {
    if (!isLoaded || checked.current) return;
    if (!workoutRecoveryConfig.enabled || !workoutRecoveryConfig.autoOfferRecovery) {
      checked.current = true;
      return;
    }
    if (pathname === "/screens/workoutRecovery" || pathname === "/screens/manualWorkoutRecovery") {
      checked.current = true;
      return;
    }

    checked.current = true;
    prepareActiveWorkoutForRuntime().then((result) => {
      // Invalid snapshots also route through recovery so we can explain the
      // problem and let the user explicitly discard the unusable state.
      if (result.status === "invalid") {
        router.replace("/screens/workoutRecovery" as any);
        return;
      }

      if (result.snapshot?.interruption?.kind === "processRestart") {
        router.replace("/screens/workoutRecovery" as any);
      }
    });
  }, [isLoaded, pathname, router, workoutRecoveryConfig.enabled, workoutRecoveryConfig.autoOfferRecovery]);

  return null;
}

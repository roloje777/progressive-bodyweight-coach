import React from "react";
import { usePathname, useRouter } from "expo-router";
import { loadActiveWorkout } from "@/storage/activeWorkoutStorage";
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
    loadActiveWorkout().then((snapshot) => {
      if (snapshot) router.replace("/screens/workoutRecovery" as any);
    });
  }, [isLoaded, pathname, router, workoutRecoveryConfig.enabled, workoutRecoveryConfig.autoOfferRecovery]);

  return null;
}

import { useEffect } from "react";
import { AppState } from "react-native";
import {
  checkpointActiveWorkout,
  pauseActiveWorkout,
  resumeActiveWorkout,
} from "@/storage/activeWorkoutStorage";
import { RecoveryScreenState, WorkoutRecoveryScreen } from "@/models/WorkoutRecovery";
import { WorkoutSession } from "@/engine/sessionBuilder";

export function useActiveWorkoutCheckpoint(input: {
  screen: WorkoutRecoveryScreen;
  blockIndex: number;
  session: WorkoutSession;
  screenState: RecoveryScreenState;
  activeBlockId?: string;
  enabled?: boolean;
}) {
  const { enabled = true } = input;
  const serializedState = JSON.stringify(input.screenState);
  const serializedSession = JSON.stringify(input.session);

  useEffect(() => {
    if (!enabled) return;
    checkpointActiveWorkout({
      screen: input.screen,
      blockIndex: input.blockIndex,
      session: input.session,
      screenState: input.screenState,
      activeBlockId: input.activeBlockId,
    });
  }, [enabled, input.screen, input.blockIndex, input.activeBlockId, serializedState, serializedSession]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      checkpointActiveWorkout({
        screen: input.screen,
        blockIndex: input.blockIndex,
        session: input.session,
        screenState: input.screenState,
        activeBlockId: input.activeBlockId,
      });
    }, 20000);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "inactive" || state === "background") {
        pauseActiveWorkout();
      } else if (state === "active") {
        resumeActiveWorkout();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled, input.screen, input.blockIndex, input.activeBlockId, serializedState, serializedSession]);
}

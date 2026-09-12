import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
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
  const lastAppStateRef = useRef<AppStateStatus>(AppState.currentState);

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

    const checkpoint = () => {
      checkpointActiveWorkout({
        screen: input.screen,
        blockIndex: input.blockIndex,
        session: input.session,
        screenState: input.screenState,
        activeBlockId: input.activeBlockId,
      });
    };

    const interval = setInterval(checkpoint, 20000);

    const subscription = AppState.addEventListener("change", (state) => {
      const previousState = lastAppStateRef.current;
      lastAppStateRef.current = state;

      if (state === "inactive" || state === "background") {
        // Only checkpoint/pause on the foreground -> non-active edge. Some
        // platforms emit inactive followed by background; double-pausing would
        // overwrite the original backgroundedAt used to measure the absence.
        if (previousState === "active") {
          pauseActiveWorkout(state);
        }
        return;
      }

      if (state === "active" && previousState !== "active") {
        // Resume trusted timing from *now*. Time spent inactive/backgrounded is
        // lifecycle metadata only and never contributes to workout duration.
        resumeActiveWorkout();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled, input.screen, input.blockIndex, input.activeBlockId, serializedState, serializedSession]);
}

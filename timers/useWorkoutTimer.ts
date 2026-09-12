import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

type RestTimerOptions = {
  /**
   * Original wall-clock start. Supplying this reconstructs rest/countdown time
   * after backgrounding or process recovery.
   */
  startedAt?: number;
};

export function useWorkoutTimer() {
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endAtRef = useRef<number | null>(null);
  const lastReportedRef = useRef<number | null>(null);
  const onTickRef = useRef<((next: number) => void) | undefined>(undefined);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);
  const completedRef = useRef(false);

  const clearIntervalOnly = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const reconcile = () => {
    const endAt = endAtRef.current;
    if (endAt == null || completedRef.current) return;

    const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

    if (lastReportedRef.current !== next) {
      lastReportedRef.current = next;
      setRestTimeLeft(next);
      onTickRef.current?.(next);
    }

    if (next <= 0) {
      completedRef.current = true;
      clearIntervalOnly();
      endAtRef.current = null;
      onCompleteRef.current?.();
    }
  };

  const startRestTimer = (
    seconds: number,
    onTick?: (next: number) => void,
    onComplete?: () => void,
    options?: RestTimerOptions,
  ) => {
    clearIntervalOnly();

    const durationMs = Math.max(0, seconds) * 1000;
    const startedAt = options?.startedAt ?? Date.now();

    onTickRef.current = onTick;
    onCompleteRef.current = onComplete;
    completedRef.current = false;
    endAtRef.current = startedAt + durationMs;
    lastReportedRef.current = null;

    reconcile();

    if (!completedRef.current) {
      intervalRef.current = setInterval(reconcile, 250);
    }
  };

  const stopRestTimer = () => {
    clearIntervalOnly();
    completedRef.current = true;
    endAtRef.current = null;
    lastReportedRef.current = 0;
    setRestTimeLeft(0);
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // JS timers may be suspended while backgrounded. Reconcile against the
        // original wall-clock deadline immediately on foreground.
        reconcile();
      }
    });

    return () => {
      subscription.remove();
      clearIntervalOnly();
    };
  }, []);

  return { restTimeLeft, startRestTimer, stopRestTimer };
}

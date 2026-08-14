//timers/useHoldTimer.ts
import { useRef, useState } from "react";

export type HoldState = "idle" | "running";

export function useHoldTimer(
  targetDuration: number,
  onSetComplete?: (duration: number) => void,
) {
  const [elapsed, setElapsed] = useState(0);
  const [state, setState] = useState<HoldState>("idle");
  const [sets, setSets] = useState<{ durationSeconds: number }[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const start = () => {
    if (intervalRef.current !== null) return;

    setState("running");

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = null;

    const durationRecorded = elapsedRef.current;

    if (durationRecorded > 0) {
      setSets((prev) => [
        ...prev,
        { durationSeconds: durationRecorded },
      ]);

      onSetComplete?.(durationRecorded);
    }

    elapsedRef.current = 0;
    setElapsed(0);
    setState("idle");
  };

  const clearSets = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = null;
    elapsedRef.current = 0;

    setSets([]);
    setElapsed(0);
    setState("idle");
  };

  const reset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = null;
    elapsedRef.current = 0;

    setElapsed(0);
    setState("idle");
  };

  return {
    elapsed,
    state,
    sets,
    start,
    stop,
    reset,
    clearSets,
  };
}
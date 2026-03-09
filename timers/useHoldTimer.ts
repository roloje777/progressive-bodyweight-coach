import { useRef, useState, useEffect } from "react";

export type HoldState = "idle" | "running";

export function useHoldTimer(
  targetDuration: number,
  onSetComplete?: (duration: number) => void
) {
  const [elapsed, setElapsed] = useState(0);
  const [state, setState] = useState<HoldState>("idle");
  const [sets, setSets] = useState<{ durationSeconds: number }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (elapsed >= targetDuration && state === "running") {
      stop();
      if (onSetComplete) onSetComplete(targetDuration);
    }
  }, [elapsed, state]);

  const start = () => {
    if (intervalRef.current !== null) return;

    setState("running");
    intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (elapsed > 0) {
      const durationRecorded = Math.min(elapsed, targetDuration);
      setSets((prev) => [...prev, { durationSeconds: durationRecorded }]);
      if (onSetComplete) onSetComplete(durationRecorded);
    }

    setElapsed(0);
    setState("idle");
  };

  const clearSets = () => {
    setSets([]);
    setElapsed(0);
    setState("idle");
  };

  return { elapsed, state, sets, start, stop, clearSets };
}
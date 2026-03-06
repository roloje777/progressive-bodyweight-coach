import { useRef, useState } from "react";

export type HoldState = "idle" | "running" | "paused";

export function useHoldTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [state, setState] = useState<HoldState>("idle");
  const [sets, setSets] = useState<{ durationSeconds: number }[]>([]);

const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

 const start = () => {
  if (intervalRef.current !== null) return;

  setState("running");

  intervalRef.current = setInterval(() => {
    setElapsed((prev) => prev + 1);
  }, 1000);
};

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState("paused");
  };

const stop = () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  if (elapsed > 0) {
    setSets((prev) => [...prev, { durationSeconds: elapsed }]);
  }

  setElapsed(0); // IMPORTANT
  setState("idle");
};

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    setElapsed(0);
    setState("idle");
  };

const clearSets = () => {
  setSets([]);
  setElapsed(0);
};

  return {
    elapsed,
    state,
    sets,
    start,
    pause,
    stop,
    reset,
    clearSets, 
  };
}
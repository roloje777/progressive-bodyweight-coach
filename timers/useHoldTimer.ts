// timers/useHoldTimer.ts
import { useEffect, useState, useRef } from "react";
import { HoldTimer, TimerState } from "./HoldTimer";

export function useHoldTimer() {
  const timerRef = useRef<HoldTimer>(new HoldTimer());
  const [elapsed, setElapsed] = useState<number>(0);
  const [state, setState] = useState<TimerState>("idle");

  useEffect(() => {
    let interval: NodeJS.Timer;

    if (state === "running") {
      interval = setInterval(() => {
        setElapsed(timerRef.current.getElapsed());
      }, 100); // update 10 times/sec for smooth UI
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const start = () => {
    timerRef.current.start();
    setState(timerRef.current.getState());
  };

  const pause = () => {
    timerRef.current.pause();
    setState(timerRef.current.getState());
    setElapsed(timerRef.current.getElapsed());
  };

  const stop = () => {
    const result = timerRef.current.stop();
    setState(timerRef.current.getState());
    setElapsed(result.duration);
    return result;
  };

  const reset = () => {
    timerRef.current.reset();
    setState(timerRef.current.getState());
    setElapsed(0);
  };

  return { elapsed, state, start, pause, stop, reset };
}
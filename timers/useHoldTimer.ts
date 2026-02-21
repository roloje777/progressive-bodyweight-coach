// timers/useHoldTimer.ts
import { useEffect, useState, useRef } from "react";
import { HoldTimer, TimerState, HoldTimerResult } from "./HoldTimer";

export function useHoldTimer() {
  const timerRef = useRef<HoldTimer>(new HoldTimer());
  const [elapsed, setElapsed] = useState<number>(0);
  const [state, setState] = useState<TimerState>("idle");
  const [sets, setSets] = useState<HoldTimerResult[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timer;

    if (state === "running") {
      interval = setInterval(() => {
        setElapsed(timerRef.current.getElapsed());
      }, 100);
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
  setElapsed(timerRef.current.getElapsed());
  setSets([...timerRef.current.getSets()]); // <-- spread to create new array
  return result;
};

  const reset = () => {
    timerRef.current.reset();
    setState(timerRef.current.getState());
    setElapsed(0);
    setSets([]);
  };

  return { elapsed, state, sets, start, pause, stop, reset };
}
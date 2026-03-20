import { useRef, useState } from "react";

export function useWorkoutTimer() {
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRestTimer = (
    seconds: number,
    onTick?: (next: number) => void,
    onComplete?: () => void
  ) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setRestTimeLeft(seconds);

    intervalRef.current = setInterval(() => {
      setRestTimeLeft((prev) => {
        const next = prev - 1;

        // ✅ Tick callback
        if (onTick) onTick(next);

        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // ✅ Complete callback
          if (onComplete) onComplete();

          return 0;
        }

        return next;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRestTimeLeft(0);
  };

  return { restTimeLeft, startRestTimer, stopRestTimer };
}
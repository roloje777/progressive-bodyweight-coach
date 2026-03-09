import { useEffect, useRef, useState } from "react";
import { Vibration } from "react-native";
import { soundManager } from "../app/services/SoundManager";

type RestPhase = "rest-set" | "rest-exercise";

interface TimerConfig {
  getReadySeconds?: number;
  enableSound?: boolean;
  enableVibration?: boolean;
}

export function useWorkoutTimer(config?: TimerConfig) {
  const GET_READY_SECONDS = config?.getReadySeconds ?? 3;
  const ENABLE_SOUND = config?.enableSound ?? true;
  const ENABLE_VIBRATION = config?.enableVibration ?? true;

  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [phase, setPhase] = useState<RestPhase | "idle">("idle");

  const [showGetReady, setShowGetReady] = useState(false);
  const [showGo, setShowGo] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function initSound() {
      soundManager.setEnabled(ENABLE_SOUND);
      await soundManager.loadSounds();
    }

    initSound();
  }, []);

  const vibrateShort = () => {
    if (!ENABLE_VIBRATION) return;
    Vibration.vibrate(150);
  };

  const startRestTimer = (
    seconds: number,
    restPhase: RestPhase,
    onComplete?: () => void,
  ) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setPhase(restPhase);
    setRestTimeLeft(seconds);
    setShowGetReady(false);

    intervalRef.current = setInterval(() => {
      setRestTimeLeft((prev) => {
        const next = prev - 1;

        // 🔊 Tick each second
        soundManager.playTick();

        // 🔔 Get Ready Warning
        if (next === GET_READY_SECONDS) {
          setShowGetReady(true);
          soundManager.playGetReady();
          vibrateShort();
        }

        // 🟢 GO
        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          setShowGetReady(false);
          setShowGo(true);

          soundManager.playGo();
          vibrateShort();

          setTimeout(() => setShowGo(false), 1200);

          onComplete?.();

          return 0;
        }

        return next;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPhase("idle");
  };

  return {
    restTimeLeft,
    phase,
    showGetReady,
    showGo,
    startRestTimer,
    stopRestTimer,
  };
}
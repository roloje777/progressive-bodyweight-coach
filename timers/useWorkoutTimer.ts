import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { Vibration } from "react-native";

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

  const tickSound = useRef<Audio.Sound | null>(null);
  const readySound = useRef<Audio.Sound | null>(null);
  const goSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    async function loadSounds() {
      if (!ENABLE_SOUND) return;

      const tick = await Audio.Sound.createAsync(
        require("../assets/sounds/tick.wav"),
      );

      const ready = await Audio.Sound.createAsync(
        require("../assets/sounds/get-ready.wav"),
      );

      const go = await Audio.Sound.createAsync(
        require("../assets/sounds/go.wav"),
      );

      tickSound.current = tick.sound;
      readySound.current = ready.sound;
      goSound.current = go.sound;
    }

    loadSounds();

    return () => {
      tickSound.current?.unloadAsync();
      readySound.current?.unloadAsync();
      goSound.current?.unloadAsync();
    };
  }, []);

  const playSound = async (sound: Audio.Sound | null) => {
    if (!ENABLE_SOUND || !sound) return;

    try {
      await sound.replayAsync();
    } catch {}
  };

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

        playSound(tickSound.current);

        if (next === GET_READY_SECONDS) {
          setShowGetReady(true);
          playSound(readySound.current);
          vibrateShort();
        }

        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          setShowGetReady(false);
          setShowGo(true);

          playSound(goSound.current);
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
    if (intervalRef.current) clearInterval(intervalRef.current);
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

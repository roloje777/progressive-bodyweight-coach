import React, { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { useHoldTimer } from "../timers/useHoldTimer";
// import { soundManager } from "../services/SoundManagerExpoAv";
import { soundManager } from "../services/SoundManager";
import { appStyles as styles } from "../styles/appStyles";
import { HoldVisual } from "./visual/HoldVisual";
import { MatchOrBeatTarget } from "../models/Exercise";
import PrimaryButton from "@/components/PrimaryButton";

interface HoldExerciseProps {
  exerciseName: string;
  description?: string;
  totalSets: number;
  duration: number;

  sets: (
    | { durationSeconds: number }
    | { durationLeft: number; durationRight: number }
  )[];

  matchOrBeatTargets?: MatchOrBeatTarget[];

  onSetComplete: (duration: number | { left: number; right: number }) => void;

  sideMode?: "none" | "alternating";
}

export const HoldExercise: React.FC<HoldExerciseProps> = ({
  exerciseName,
  totalSets,
  duration,
  sets,
  sideMode = "none",
  matchOrBeatTargets = [],
  onSetComplete,
}) => {
  // ✅ safer than useState for async timing
  const leftDurationRef = useRef(0);

  const [isStarting, setIsStarting] = React.useState(false);

  const [currentSide, setCurrentSide] = React.useState<"left" | "right">(
    "left",
  );

  const [phase, setPhase] = React.useState<"idle" | "running" | "transition">(
    "idle",
  );

  // ✅ Match / Beat logic
  const currentSetNumber = sets.length + 1;

  const currentTarget = matchOrBeatTargets.find(
    (t) => t.setNumber === currentSetNumber,
  );

  // ✅ TIMER COMPLETE
  const handleTimerComplete = async (elapsedDuration: number) => {
    if (sideMode === "alternating") {
      // LEFT SIDE FINISHED
      if (currentSide === "left") {
        // ✅ store safely
        leftDurationRef.current = elapsedDuration;

        // transition to right
        setPhase("transition");

        await soundManager.playNextSide?.(true);

        setTimeout(() => {
          setCurrentSide("right");
          setPhase("idle");
        }, 1500);

        return;
      }

      // RIGHT SIDE FINISHED
      onSetComplete({
        left: leftDurationRef.current,
        right: elapsedDuration,
      });

      // reset
      leftDurationRef.current = 0;

      setCurrentSide("left");
      setPhase("idle");

      return;
    }

    // NORMAL HOLD
    onSetComplete(elapsedDuration);

    setPhase("idle");
  };

  const { elapsed, state, start, stop, reset } = useHoldTimer(
    duration,
    handleTimerComplete,
  );

  const remaining = Math.max(duration - elapsed, 0);

  // ✅ START
  const handleStart = async () => {
    if (state === "running" || isStarting) return;

    setIsStarting(true);

    await soundManager.playReadySetGoSound(true);

    start();

    setPhase("running");

    setIsStarting(false);
  };

  /**
   * SOUND GUIDE
   */
  useEffect(() => {
    if (state !== "running") return;

    const run = async () => {
      if (remaining <= 0) return;

      // final countdown
      if (remaining < 5) {
        soundManager.playCountdownBeep();
        return;
      }

      // halfway
      if (remaining === Math.floor(duration / 2)) {
        soundManager.playHalfWay();
        return;
      }

      // every 5 sec
      if (remaining % 5 === 0) {
        soundManager.playTick();
        return;
      }
    };

    run();
  }, [elapsed, remaining, state, duration]);

  // ✅ reset timer when switching sides
  useEffect(() => {
    if (phase === "idle" && currentSide === "right") {
      reset();
    }
  }, [currentSide, phase]);

  return (
    <View style={styles.exerciseContainer}>
      {/* MATCH / BEAT */}
      {currentTarget && (
        <Text
          style={{
            color: "#FFD700",
            fontSize: 16,
            marginBottom: 10,
            fontWeight: "bold",
          }}
        >
          Match or Beat: {currentTarget.target}s
        </Text>
      )}

      {/* SIDE INDICATOR */}
      {sideMode === "alternating" && (
        <Text style={{ color: "#FFD700", fontSize: 18 }}>
          Side: {currentSide.toUpperCase()}
        </Text>
      )}

      {/* TRANSITION */}
      {phase === "transition" && (
        <Text style={{ fontSize: 24, color: "#FFD700", marginTop: 20 }}>
          Next Side...
        </Text>
      )}

      {/* VISUAL */}
      <HoldVisual remaining={remaining} duration={duration} />

      {/* START BUTTON */}
      {state !== "running" && phase !== "transition" && (
        <PrimaryButton
          title={
            isStarting
              ? "Get Ready..."
              : sideMode === "alternating"
                ? `Start ${currentSide.toUpperCase()}`
                : "Start"
          }
          disabled={isStarting}
          onPress={handleStart}
        />
      )}

      {/* COMPLETED SETS */}
      {sets.map((item, index) => (
        <Text key={index} style={styles.setText}>
          Set {index + 1}:{" "}
          {"durationSeconds" in item
            ? `${item.durationSeconds}s`
            : `L:${item.durationLeft}s / R:${item.durationRight}s`}
        </Text>
      ))}
    </View>
  );
};

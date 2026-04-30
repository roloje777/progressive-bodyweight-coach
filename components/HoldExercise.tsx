import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useHoldTimer } from "../timers/useHoldTimer";
import { soundManager } from "../services/SoundManagerExpoAv";
import { appStyles as styles } from "../styles/appStyles";
import { HoldVisual } from "./visual/HoldVisual";

interface HoldExerciseProps {
  exerciseName: string;
  description?: string;
  totalSets: number;
  duration: number;
  sets: { durationSeconds: number }[];
 onSetComplete: (duration: number | { left: number; right: number }) => void;
  sideMode?: "none" | "alternating"; // 👈 NEW
}

export const HoldExercise: React.FC<HoldExerciseProps> = ({
  exerciseName,
  totalSets,
  duration,
  sets,
   sideMode = "none", // ✅ ADD THIS
  onSetComplete,
}) => {
const [leftDuration, setLeftDuration] = useState(0);
const [rightDuration, setRightDuration] = useState(0);

  // const handleTimerComplete = async (elapsedDuration: number) => {
  //   if (sideMode === "alternating") {
  //     if (currentSide === "left") {
  //       // 🔁 switch to right
  //       setPhase("transition");

  //       await soundManager.playNextSide?.(true); // optional

  //       setTimeout(() => {
  //         setCurrentSide("right");
  //         setPhase("idle");
  //       }, 3000);

  //       return;
  //     }
  //   }

  //   // ✅ final completion (right side OR non-sided)
  //   onSetComplete(elapsedDuration);

  //   setCurrentSide("left");
  //   setPhase("idle");
  // };
  const handleTimerComplete = async (elapsedDuration: number) => {
  if (sideMode === "alternating") {
    if (currentSide === "left") {
      // ✅ save LEFT
      setLeftDuration(elapsedDuration);

      // 🔁 switch to right
      setPhase("transition");

      await soundManager.playNextSide?.(true);

      setTimeout(() => {
        setCurrentSide("right");
        setPhase("idle");
      }, 1500);

      return;
    }

    // ✅ save RIGHT
    setRightDuration(elapsedDuration);

    // ✅ COMPLETE SET WITH BOTH SIDES
    onSetComplete({
      left: leftDuration,
      right: elapsedDuration,
    });

    // reset
    setLeftDuration(0);
    setRightDuration(0);
    setCurrentSide("left");
    setPhase("idle");

    return;
  }

  // ✅ normal (non-alternating)
  onSetComplete(elapsedDuration);
};

   const { elapsed, state, start, stop, reset } =
  useHoldTimer(duration, handleTimerComplete);

  const remaining = Math.max(duration - elapsed, 0);

  const [isStarting, setIsStarting] = React.useState(false);

  const [currentSide, setCurrentSide] = React.useState<"left" | "right">(
    "left",
  );
  const [phase, setPhase] = React.useState<"idle" | "running" | "transition">(
    "idle",
  );

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

      if (remaining <= 5) {
        soundManager.playCountdownBeep();
        return;
      }

      if (remaining === Math.floor(duration / 2)) {
        soundManager.playHalfWay();
        return;
      }

      if (remaining % 5 === 0) {
        soundManager.playTick();
      }
    };

    run();
  }, [elapsed, remaining, state, duration]);

  useEffect(() => {
  if (phase === "idle" && currentSide === "right") {
    reset(); // 👈 important
  }
}, [currentSide, phase]);



  return (
  <View style={styles.container}>
    {sideMode === "alternating" && (
      <Text style={{ color: "#FFD700", fontSize: 18 }}>
        Side: {currentSide.toUpperCase()}
      </Text>
    )}
    {phase === "transition" && (
  <Text style={{ fontSize: 24, color: "#FFD700", marginTop: 20 }}>
    Next Side...
  </Text>
)}

    <HoldVisual remaining={remaining} duration={duration} />
      {/* <HoldVisual remaining={remaining} duration={duration} /> */}

     {state !== "running" && phase !== "transition" && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
          disabled={isStarting}
        >
          <Text style={styles.buttonText}>
            {isStarting ? "Get Ready..." : "Start"}
          </Text>
        </TouchableOpacity>
      )}

      {/* <FlatList
        data={sets}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.setText}>
            Set {index + 1}: {item.durationSeconds}s
          </Text>
        )}
      /> */}
    </View>
  );
};

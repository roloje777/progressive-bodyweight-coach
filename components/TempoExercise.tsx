import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { soundManager } from "../services/SoundManagerExpoAv";
import { appStyles as styles } from "../styles/appStyles";
import { TempoVisual } from "./visual/TempoVisual";

// ---- TYPES ----
export interface TempoConfig {
  startPhase: "eccentric" | "concentric";
  eccentric: number;
  pauseEccentric?: number;
  concentric: number;
  pauseConcentric?: number;
}

export type TempoPhase =
  | "eccentric"
  | "pauseEccentric"
  | "concentric"
  | "pauseConcentric";

export function buildTempoPhases(config: TempoConfig): TempoPhase[] {
  return config.startPhase === "eccentric"
    ? ["eccentric", "pauseEccentric", "concentric", "pauseConcentric"]
    : ["concentric", "pauseConcentric", "eccentric", "pauseEccentric"];
}

export function getPhaseDuration(phase: TempoPhase, config: TempoConfig) {
  switch (phase) {
    case "eccentric":
      return config.eccentric;
    case "concentric":
      return config.concentric;
    case "pauseEccentric":
      return config.pauseEccentric || 0;
    case "pauseConcentric":
      return config.pauseConcentric || 0;
  }
}

// ---- PROPS ----
interface TempoExerciseProps {
  exerciseName: string;
  totalSets: number;
  config: TempoConfig;
  minReps: number;
  maxReps: number;

  sideMode?: "none" | "alternating";

  sets: { reps: number; phaseDurations: number[] }[];

  onCompleteSet: (set: {
    reps: number | { left: number; right: number };
    phaseDurations: number[];
  }) => void;
}

export const TempoExercise: React.FC<TempoExerciseProps> = ({
  exerciseName,
  totalSets,
  config,
  minReps,
  maxReps,
  sideMode = "none",
  sets,
  onCompleteSet,
}) => {
  const [inputLeft, setInputLeft] = useState("");
  const [inputRight, setInputRight] = useState("");
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showRepsInput, setShowRepsInput] = useState(false);
  const [inputReps, setInputReps] = useState("");

  const [cycleCount, setCycleCount] = useState(0);

  const [side, setSide] = useState<"left" | "right">("left");
  const [leftReps, setLeftReps] = useState(0);
  const [rightReps, setRightReps] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const phaseIndexRef = useRef(0);

  const phases = buildTempoPhases(config);

  // ---- START TIMER ----
  const startTimer = async () => {
    if (running || intervalRef.current) return;

    await soundManager.playReadySetGoSound(true);

    setRunning(true);
    setPhaseIndex(0);
    phaseIndexRef.current = 0;

    setCycleCount(0);

    const firstPhase = phases[0];
    setTimeLeft(getPhaseDuration(firstPhase, config));

    soundManager.playPhaseSound(firstPhase);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0.5) return prev - 0.5;

        // move phase
        phaseIndexRef.current = (phaseIndexRef.current + 1) % phases.length;

        const nextIndex = phaseIndexRef.current;
        setPhaseIndex(nextIndex);

        const nextPhase = phases[nextIndex];
        soundManager.playPhaseSound(nextPhase);

        // rep counting
        if (nextIndex === 0) {
          if (sideMode === "alternating") {
            if (side === "left") {
              setLeftReps((r) => r + 1);
            } else {
              setRightReps((r) => r + 1);
            }
          } else {
            setCycleCount((c) => c + 1);
          }
        }

        return getPhaseDuration(nextPhase, config);
      });
    }, 500);
  };

  // ---- STOP TIMER ----
  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    setRunning(false);

    if (sideMode === "alternating") {
      if (side === "left") {
        // ✅ finished LEFT → switch to RIGHT
        setSide("right");

        // ✅ ensure input UI is hidden
        setShowRepsInput(false);

        return; // ❗ don't complete set yet
      }

      // ✅ finished RIGHT → prepare inputs
      setInputLeft(String(leftReps));
      setInputRight(String(rightReps));

      setShowRepsInput(true);
      return;
    }

    // normal mode
    setInputReps(String(cycleCount));
    setShowRepsInput(true);
  };

  // ---- COMPLETE SET (FIXED) ----
  const handleCompleteSet = () => {
    let repsValue: number | { left: number; right: number };

    if (sideMode === "alternating") {
      repsValue = {
        left: parseInt(inputLeft) || 0,
        right: parseInt(inputRight) || 0,
      };
    } else {
      repsValue = parseInt(inputReps) || 0;
    }

    onCompleteSet({
      reps: repsValue,
      phaseDurations: [],
    });

    // reset
    setInputReps("");
    setCycleCount(0);
    setLeftReps(0);
    setRightReps(0);
    setSide("left");
    setShowRepsInput(false);
    setRunning(false);
    setPhaseIndex(0);
  };

  // ---- CLEANUP ----
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (showRepsInput) {
      inputRef.current?.focus();
    }
  }, [showRepsInput]);

  const isStartDisabled = showRepsInput;

  // ---- RENDER ----
  return (
    <View style={styles.container}>
      <Text style={styles.target}>
        Target: {minReps} - {maxReps} reps
      </Text>

      <TempoVisual phase={phases[phaseIndex]} />

      {sideMode === "alternating" ? (
        <>
          <Text style={{ fontSize: 40, color: "#FFD700" }}>
            L: {leftReps} | R: {rightReps}
          </Text>
          <Text style={{ color: "#aaa" }}>Current: {side}</Text>
        </>
      ) : (
        <Text style={{ fontSize: 60, color: "white" }}>{cycleCount}</Text>
      )}

      <Text style={{ color: "#aaa" }}>{Math.ceil(timeLeft)}s</Text>

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {sideMode === "alternating" &&
          side === "right" &&
          !running &&
          !showRepsInput && (
            <Text style={{ color: "#FFD700", fontSize: 18 }}>
              Next Side → RIGHT
            </Text>
          )}
        {!running && !showRepsInput && (
          <TouchableOpacity style={styles.button} onPress={startTimer}>
            <Text style={styles.buttonText}>
              {sideMode === "alternating"
                ? `Start ${side.toUpperCase()}`
                : "Start"}
            </Text>
          </TouchableOpacity>
        )}

        {running && (
          <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}

        {showRepsInput && (
          <>
            {sideMode === "alternating" ? (
              <>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: "#aaa" }}>L</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={inputLeft}
                      onChangeText={setInputLeft}
                    />
                  </View>

                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: "#aaa" }}>R</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={inputRight}
                      onChangeText={setInputRight}
                    />
                  </View>
                </View>
              </>
            ) : (
              <TextInput
                ref={inputRef}
                style={styles.input}
                keyboardType="number-pad"
                value={inputReps}
                onChangeText={setInputReps}
              />
            )}

            <TouchableOpacity style={styles.button} onPress={handleCompleteSet}>
              <Text style={styles.buttonText}>Complete Set</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

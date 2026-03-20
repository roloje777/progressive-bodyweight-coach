// app/components/TempoExercise.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { soundManager } from "../services/SoundManager";
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

// ---- HELPERS ----
export function buildTempoPhases(config: TempoConfig): TempoPhase[] {
  if (config.startPhase === "eccentric") {
    return ["eccentric", "pauseEccentric", "concentric", "pauseConcentric"];
  } else {
    return ["concentric", "pauseConcentric", "eccentric", "pauseEccentric"];
  }
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

// ---- COMPONENT ----
interface TempoExerciseProps {
  exerciseName: string;
  totalSets: number;
  config: TempoConfig;
  minReps: number;
  maxReps: number;

  sets: { reps: number; phaseDurations: number[] }[];

  onCompleteSet: (set: { reps: number; phaseDurations: number[] }) => void;
}

export const TempoExercise: React.FC<TempoExerciseProps> = ({
  exerciseName,
  totalSets,
  config,
  minReps,
  maxReps,
  sets,
  onCompleteSet,
}) => {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showRepsInput, setShowRepsInput] = useState(false);
  const [inputReps, setInputReps] = useState("");

  const [phaseDurations, setPhaseDurations] = useState<number[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIndexRef = useRef(0);
  const inputRef = useRef<TextInput>(null);

  const phases = buildTempoPhases(config);

  const [cycleCount, setCycleCount] = useState(0);

  // ---- START TIMER ----
  // ---- START TIMER ----
  const startTimer = async () => {
    if (running || showRepsInput || intervalRef.current) return;

    // 🎵 Wait for Ready-Set-Go before starting timer
    await soundManager.playReadySetGoSound();

    setRunning(true);
    setPhaseIndex(0);
    phaseIndexRef.current = 0;

    setPhaseDurations([0]);
    const firstPhase = phases[0];
    setTimeLeft(getPhaseDuration(firstPhase, config));

    // 🎵 Play the starting phase sound immediately
    soundManager.playPhaseSound(firstPhase);

    intervalRef.current = setInterval(() => {
      setPhaseDurations((dur) => {
        const last = dur[dur.length - 1] ?? 0;
        return [...dur.slice(0, -1), last + 0.5];
      });

      setTimeLeft((prevTime) => {
        if (prevTime > 0.5) return prevTime - 0.5;

        // move to next phase
        phaseIndexRef.current = (phaseIndexRef.current + 1) % phases.length;
        setPhaseIndex(phaseIndexRef.current);

        setPhaseDurations((dur) => [...dur, 0]);

        // ✅ If we wrapped to the first phase, increment cycles
        if (phaseIndexRef.current === 0) {
          setCycleCount((prev) => {
            const newCount = prev + 1;
            setInputReps(newCount.toString()); // auto-update input
            return newCount;
          });
        }

        const nextPhase = phases[phaseIndexRef.current];

        // 🎵 play guided sound for the next phase
        soundManager.playPhaseSound(nextPhase);

        return getPhaseDuration(nextPhase, config);
      });
    }, 500);
  };

  // ---- STOP TIMER ----
  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    setRunning(false);
    setShowRepsInput(true);
  };

  // ---- COMPLETE SET ----
  const handleCompleteSet = () => {
    const repsNum = parseInt(inputReps) || 0;

    const newSet = {
      reps: repsNum,
      phaseDurations,
    };

    onCompleteSet(newSet);

    setInputReps("");
    setCycleCount(0); // ✅ reset counter
    setShowRepsInput(false);

    setPhaseIndex(0);
    setPhaseDurations([]);
    setTimeLeft(0);
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

  // ---- BUTTON STATE ----
  const isStartDisabled = showRepsInput;

  // ---- RENDER ----
  return (
    <View style={styles.container}>
      <Text style={styles.target}>
        Target: {minReps} - {maxReps} reps
      </Text>
      <TempoVisual phase={phases[phaseIndex]} />

      <Text style={{ fontSize: 60, color: "white", marginVertical: 10 }}>
        {cycleCount}
      </Text>
      <Text style={{ color: "#aaa", marginBottom: 10 }}>reps</Text>

      <Text style={styles.phaseText}>{Math.ceil(timeLeft)}s</Text>

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {!running && (
          <TouchableOpacity
            style={[styles.button, isStartDisabled && styles.disabledButton]}
            onPress={startTimer}
            disabled={isStartDisabled}
          >
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        )}

        {running && (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopTimer}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}

        {showRepsInput && (
          <>
            <TextInput
              ref={inputRef}
              style={styles.input}
              keyboardType="numeric"
              placeholder={`${minReps} - ${maxReps}`}
              placeholderTextColor="#777"
              value={inputReps}
              onChangeText={setInputReps}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[
                styles.button,
                { marginLeft: 10 },
                !inputReps && { backgroundColor: "#555" },
              ]}
              onPress={handleCompleteSet}
              disabled={!inputReps}
            >
              <Text style={styles.buttonText}>Complete Set</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* <FlatList
        data={sets}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ index, item }) => (
          <Text style={styles.setText}>
            Set {index + 1}: {item.reps} reps
          </Text>
        )}
        style={{ marginTop: 10, width: "100%" }}
      /> */}
    </View>
  );
};

import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import PrimaryButton from "@/components/PrimaryButton";

// import { soundManager } from "../services/SoundManagerExpoAv";
import { soundManager } from "../services/SoundManager";
import { appStyles as styles } from "../styles/appStyles";
import { TempoVisual } from "./visual/TempoVisual";
import { MatchOrBeatTarget } from "../models/Exercise";

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

  matchOrBeatTargets?: MatchOrBeatTarget[];

  sets: {
    reps: number | { left: number; right: number };
    phaseDurations: number[];
  }[];

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
  matchOrBeatTargets = [],
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

  const currentSetNumber = sets.length + 1;

  const currentTarget = matchOrBeatTargets.find(
    (t) => t.setNumber === currentSetNumber,
  );

  // ---- START TIMER ----
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const startTimer = async () => {
      if (running || starting || intervalRef.current) return;

      setStarting(true);
       startingRef.current = true;

    await soundManager.playReadySetGoSound(true);

    setRunning(true);
    setStarting(false);
    setPhaseIndex(0);
    phaseIndexRef.current = 0;

    setCycleCount(0);

    const firstPhase = phases[0];
    setTimeLeft(getPhaseDuration(firstPhase, config));

    void soundManager.playPhaseSound(firstPhase, true);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0.5) return prev - 0.5;

        // move phase
        phaseIndexRef.current = (phaseIndexRef.current + 1) % phases.length;

        const nextIndex = phaseIndexRef.current;
        setPhaseIndex(nextIndex);

        const nextPhase = phases[nextIndex];
        void soundManager.playPhaseSound(nextPhase, true);

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

startingRef.current = false;
  };

  // ---- STOP TIMER ----
  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    setRunning(false);
    startingRef.current = false;

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
    startingRef.current = false;
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

 const isStartDisabled =
  running ||
  starting ||
  showRepsInput;

  // ---- RENDER ----
  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.target }>
        Target: {minReps} - {maxReps} reps
      </Text>
      {currentTarget && (
        <Text
          style={{
            color: "#FFD700",
            fontSize: 16,
            marginBottom: 10,
            fontWeight: "bold",
            textAlign: "center"
          }}
        >
          Match or Beat: {currentTarget.target}
        </Text>
      )}

      <TempoVisual phase={phases[phaseIndex]} />

         <Text
        style={{
          fontSize: 42,
          fontWeight: "bold",
          color: "#FFD700",
          textAlign: "center",
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        {Math.ceil(timeLeft)}s
      </Text>

      {sideMode === "alternating" ? (
        <>
          <Text
            style={{
              fontSize: 42,
              color: "#FFD700",
              fontWeight: "bold",
              textAlign: "center",
              alignSelf: "center",
            }}
          >
            L: {leftReps} | R: {rightReps}
          </Text>
          <Text style={{ color: "#aaa" }}>Current: {side}</Text>
        </>
      ) : (
        <Text
          style={{
            fontSize: 72,
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
            alignSelf: "center",
          }}
        >
          {cycleCount}
        </Text>
      )}  
      

      <View
        style={{
          marginTop: 16,
          alignItems: "center",
          width: "100%",
        }}
      >
        {sideMode === "alternating" &&
          side === "right" &&
          !running &&
          !showRepsInput && (
            <Text
              style={{
                color: "#FFD700",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Next Side → RIGHT
            </Text>
          )}

        {!running && !showRepsInput && (
          <View  style={{ width: "100%", alignItems: "center", }}
>
          <PrimaryButton
            title={
              sideMode === "alternating"
                ? `Start ${side.toUpperCase()}`
                : "Start"
            }
            onPress={startTimer}
            disabled={isStartDisabled}
          />
          </View>
        )}

        {running && (
          <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}

        {showRepsInput && (
          <View
            style={{
              alignItems: "center",
              width: "100%",
            }}
          >
            {sideMode === "alternating" ? (
              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: "#FFD700",
                      fontWeight: "bold",
                    }}
                  >
                    Left
                  </Text>

                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={inputLeft}
                    onChangeText={setInputLeft}
                  />
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: "#FFD700",
                      fontWeight: "bold",
                    }}
                  >
                    Right
                  </Text>

                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={inputRight}
                    onChangeText={setInputRight}
                  />
                </View>
              </View>
            ) : (
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    width: 100,
                    textAlign: "center",
                    fontSize: 24,
                    marginBottom: 20,
                  },
                ]}
                keyboardType="number-pad"
                value={inputReps}
                onChangeText={setInputReps}
              />
            )}

            <PrimaryButton title="Complete Set" onPress={handleCompleteSet} />
          </View>
        )}
      </View>
    </View>
  );
};

// app/components/TempoExercise.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";

// ---- TYPES ----
export interface TempoConfig {
  startPhase: "eccentric" | "concentric";
  eccentric: number;
  pauseEccentric?: number; // pause after eccentric
  concentric: number;
  pauseConcentric?: number; // pause after concentric
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
  onCompleteSet: (set: { reps: number; phaseDurations: number[] }) => void;
  onCompleteExercise: () => void;
  restBetweenSets?: number;
  restBetweenExercises?: number;
}

export const TempoExercise: React.FC<TempoExerciseProps> = ({
  exerciseName,
  totalSets,
  config,
  onCompleteSet,
  onCompleteExercise,
  restBetweenSets = 10,
  restBetweenExercises = 15,
}) => {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showRepsInput, setShowRepsInput] = useState(false);
  const [inputReps, setInputReps] = useState("");
  const [setsCompleted, setSetsCompleted] = useState<
    { reps: number; phaseDurations: number[] }[]
  >([]);
  const [phaseDurations, setPhaseDurations] = useState<number[]>([]);
  const [restTime, setRestTime] = useState(0);
  const [restPhase, setRestPhase] = useState<"set" | "exercise" | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phases = buildTempoPhases(config);

  // ---- START TIMER ----
 const phaseIndexRef = useRef(0);

const startTimer = () => {
  if (running || showRepsInput || restPhase) return;

  setRunning(true);
  setShowRepsInput(false);
  setPhaseIndex(0);
  phaseIndexRef.current = 0;

  // Initialize phase durations
  setPhaseDurations([0]);
  let currentPhase = phases[phaseIndexRef.current];
  setTimeLeft(getPhaseDuration(currentPhase, config));

  intervalRef.current = setInterval(() => {
    setPhaseDurations((dur) => {
      const last = dur[dur.length - 1] ?? 0;
      const newDur = [...dur.slice(0, -1), last + 0.5];
      console.log(`Phase ${phases[phaseIndexRef.current]} tick:`, newDur);
      return newDur;
    });

    setTimeLeft((prevTime) => {
      if (prevTime > 0.5) return prevTime - 0.5;

      // Phase finished → move to next
      phaseIndexRef.current = (phaseIndexRef.current + 1) % phases.length;
      setPhaseIndex(phaseIndexRef.current);

      // Start new phase duration
      setPhaseDurations((dur) => [...dur, 0]);

      const nextPhase = phases[phaseIndexRef.current];
      console.log("Moving to next phase:", nextPhase);
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
    const newSet = { reps: repsNum, phaseDurations };

    setSetsCompleted((prev) => [...prev, newSet]);
    onCompleteSet(newSet);

    setInputReps("");
    setPhaseIndex(0);
    setPhaseDurations([]);
    setTimeLeft(0);
    setShowRepsInput(false);

    const completed = setsCompleted.length + 1;

    if (completed < totalSets) {
      setRestPhase("set");
      setRestTime(restBetweenSets);
    } else {
      setRestPhase("exercise");
      setRestTime(restBetweenExercises);
    }
  };

  // ---- REST TIMER ----
  useEffect(() => {
    if (!restPhase || restTime <= 0) return;

    const restInterval = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 0.5) {
          clearInterval(restInterval);
          if (restPhase === "exercise") onCompleteExercise();
          setRestPhase(null);
          return 0;
        }
        return prev - 0.5;
      });
    }, 500);

    return () => clearInterval(restInterval);
  }, [restTime, restPhase]);

  // ---- CLEANUP ----
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ---- RENDER ----
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseName}</Text>
      <Text style={styles.setInfo}>
        Set {setsCompleted.length + 1} / {totalSets}
      </Text>

      {restPhase && (
        <Text style={styles.restText}>
          {restPhase === "set" ? "Rest Between Sets" : "Rest Between Exercises"}
          : {Math.ceil(restTime)}s
        </Text>
      )}

      {!restPhase && (
        <>
          <Text style={styles.phaseText}>
            Phase: {phases[phaseIndex]} | Time Left: {Math.ceil(timeLeft)}s
          </Text>

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={running ? stopTimer : startTimer}
              disabled={showRepsInput}
            >
              <Text style={styles.buttonText}>
                {running ? "Stop" : "Start"}
              </Text>
            </TouchableOpacity>

            {showRepsInput && (
              <>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="Reps"
                  value={inputReps}
                  onChangeText={setInputReps}
                />
                <TouchableOpacity
                  style={[styles.button, { marginLeft: 10 }]}
                  onPress={handleCompleteSet}
                >
                  <Text style={styles.buttonText}>Complete Set</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <FlatList
            data={setsCompleted}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ index, item }) => (
              <Text style={styles.setText}>
                Set {index + 1}: {item.reps} reps | Phases:{" "}
                {item.phaseDurations.map((d) => Math.ceil(d)).join(", ")}s
              </Text>
            )}
            style={{ marginTop: 10, width: "100%" }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 20, padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 10 },
  setInfo: { fontSize: 20, color: "#00FF00", marginBottom: 10 },
  phaseText: { fontSize: 18, color: "#FFD700", marginBottom: 10 },
  restText: { fontSize: 24, color: "#FFD700", marginBottom: 10 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#FFF",
    padding: 8,
    marginLeft: 10,
    borderRadius: 8,
    width: 80,
    color: "white",
  },
  setText: { color: "#FFD700", fontSize: 16, marginTop: 5 },
});

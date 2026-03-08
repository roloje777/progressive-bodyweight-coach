// app/screens/Workout.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { useWorkoutTimer } from "../../timers/useWorkoutTimer";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { beginnerProgram } from "../../data/beginnerProgram";
import { HoldExercise } from "../components/HoldExercise";
import { RepsExercise } from "../components/RepsExercise";
import { RepConfig } from "../../models/Exercise";

export default function Workout() {
  const [engine] = useState(() => new ProgramEngine(beginnerProgram));
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<
    "active" | "rest-set" | "rest-exercise" | "completed"
  >("active");
  const [, forceRefresh] = useState(0);

  const { restTimeLeft, showGetReady, showGo, startRestTimer } =
    useWorkoutTimer({
      getReadySeconds: 3,
      enableSound: true,
      enableVibration: true,
    });

  // --- Timer and sets state lifted to parent ---
  const [elapsed, setElapsed] = useState(0);

  type WorkoutSet = { durationSeconds: number } | { reps: number };
  const [sets, setSets] = useState<WorkoutSet[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentExercise, setCurrentExercise] = useState<
    ReturnType<typeof engine.getCurrentExercise> | undefined
  >(engine.getCurrentExercise());

  /** Timer controls */
  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    setPhase("active");
  };
  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };
  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setElapsed(0);
  };

  const completeRepSet = (reps: number) => {
    if (!currentExercise) return;

    const newSet = { reps };

    const updatedSets = [...sets, newSet];
    setSets(updatedSets);

    engine.completeSet({
      setNumber: updatedSets.length,
      repsCompleted: reps,
    });

    checkSetCompletion(updatedSets);
  };
  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (!currentExercise) return;

    if (elapsed > 0 && sets.length < currentExercise.sets) {
      const newSet = { durationSeconds: elapsed };

      const updatedSets = [...sets, newSet];
      setSets(updatedSets);

      engine.completeSet({
        setNumber: updatedSets.length,
        durationSeconds: elapsed,
      });

      setElapsed(0);

      checkSetCompletion(updatedSets);
    }
  };

  /** Check if we need to move to next exercise or finish */
  const checkSetCompletion = (updatedSets: WorkoutSet[]) => {
    if (!currentExercise) return;

    const isLastSet = updatedSets.length >= currentExercise.sets;
    const isLastExercise = !engine.hasNextExercise();

    // REST BETWEEN SETS
    if (!isLastSet) {
      setPhase("rest-set");

      startRestTimer(beginnerProgram.restBetweenSets ?? 20, "rest-set", () =>
        setPhase("active"),
      );

      return;
    }

    // LAST SET COMPLETED
    if (isLastExercise) {
      setPhase("completed");
      setCurrentExercise(undefined);
    } else {
      setPhase("rest-exercise");

      startRestTimer(
        beginnerProgram.restBetweenExercises ?? 30,
        "rest-exercise",
        handleNextExercise,
      );
    }
  };

  const handleNextExercise = () => {
    if (!engine.hasNextExercise()) return;
    engine.nextExercise();
    setCurrentExercise(engine.getCurrentExercise());
    setSets([]);
    reset();
    setPhase("active");
  };

  const handleFinishWorkout = async () => {
    const completedWorkout = engine.finishWorkout();
    console.log("Workout finished:", completedWorkout);
    setStarted(false);
    setElapsed(0);
    setSets([]);
    setPhase("active");
    engine.startWorkout();
    setCurrentExercise(engine.getCurrentExercise());
  };

  if (!currentExercise && started && phase !== "completed") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading next exercise...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!started ? (
        <>
          <Text style={styles.title}>Workout</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              engine.startWorkout();
              setStarted(true);
              setPhase("active");
              setCurrentExercise(engine.getCurrentExercise());
            }}
          >
            <Text style={styles.buttonText}>Start Workout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {currentExercise && (
            <>
              <Text style={styles.title}>{currentExercise.name}</Text>
              <Text style={styles.state}>
                {sets.length} / {currentExercise.sets} sets
              </Text>
            </>
          )}

          {/* REST TIMER DISPLAY */}
          {phase !== "active" && restTimeLeft > 0 && (
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <Text style={{ fontSize: 26, color: "#FFD700" }}>
                {phase === "rest-set"
                  ? "Rest Between Sets"
                  : "Rest Between Exercises"}
              </Text>

              <Text style={{ fontSize: 60, color: "white", marginTop: 10 }}>
                {restTimeLeft}s
              </Text>
            </View>
          )}

          {currentExercise?.type === "hold" &&
            phase === "active" &&
            (() => {
              const holdConfig = currentExercise.config as {
                durationSeconds: number;
              };

              return (
                <HoldExercise
                  exerciseName={currentExercise.name}
                  totalSets={currentExercise.sets}
                  elapsed={elapsed}
                  duration={holdConfig.durationSeconds}
                  sets={sets.filter((s): s is { durationSeconds: number } => "durationSeconds" in s)}
                  start={start}
                  pause={pause}
                  stop={stop}
                  reset={reset}
                />
              );
            })()}
          {/* REPS EXERCISE */}
          {currentExercise?.type === "reps" && phase === "active" && (
            <RepsExercise
              exerciseName={currentExercise.name}
              totalSets={currentExercise.sets}
             sets={sets.filter((s): s is { reps: number } => "reps" in s)}
              minReps={(currentExercise.config as RepConfig).minReps}
              maxReps={(currentExercise.config as RepConfig).maxReps}
              onCompleteSet={completeRepSet}
            />
          )}

          {phase === "completed" && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleFinishWorkout}
            >
              <Text style={styles.buttonText}>Finish Workout</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  state: { color: "white", fontSize: 16, marginTop: 10 },
  button: {
    backgroundColor: "#FF6B00",
    paddingVertical: 12,
    paddingHorizontal: 15,
    margin: 5,
    borderRadius: 12,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

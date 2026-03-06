// app/(tabs)/workout.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

import Animated from "react-native-reanimated";

import { useHoldTimer } from "../../timers/useHoldTimer";
import { useWorkoutTimer } from "../../timers/useWorkoutTimer";

import { beginnerProgram } from "../../data/beginnerProgram";
import { ProgramEngine } from "../../engine/ProgramEngine";

import { CompletedSet } from "../../models/WorkoutLog";
import { saveCompletedWorkout } from "../../storage/workoutStorage";
import { HoldConfig } from "../../models/Exercise";

type WorkoutPhase = "active" | "rest-set" | "rest-exercise" | "completed";

export default function Workout() {
  /* ---------------- HOLD TIMER ---------------- */
  const { elapsed, sets, start, pause, stop, reset, clearSets } =
    useHoldTimer();

  /* ---------------- REST TIMER ---------------- */
  const { restTimeLeft, showGetReady, showGo, startRestTimer } =
    useWorkoutTimer({
      getReadySeconds: 3,
      enableSound: true,
      enableVibration: true,
    });

  /* ---------------- PROGRAM ENGINE ---------------- */
  const [engine] = useState(() => new ProgramEngine(beginnerProgram));
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<WorkoutPhase>("active");
  const [, forceRefresh] = useState(0);

  const program = engine.getProgram();

  /* ---------------- CURRENT EXERCISE ---------------- */
  const currentExercise = engine.getCurrentExercise();

  const currentExerciseDuration =
    currentExercise?.type === "hold"
      ? (currentExercise.config as HoldConfig).durationSeconds
      : 0;

  const totalSets = currentExercise?.sets ?? 0;

  const currentSetNumber = Math.min(
    engine.getCompletedSetCount() + (phase === "active" ? 1 : 0),
    totalSets,
  );

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  /* ---------------- REST PROGRESS ---------------- */
  const totalRestTime =
    phase === "rest-set"
      ? program.restBetweenSets ?? 15
      : phase === "rest-exercise"
      ? program.restBetweenExercises ?? 30
      : 0;

  const restProgressPercent =
    totalRestTime > 0 ? (restTimeLeft / totalRestTime) * 100 : 0;

  /* ---------------- HANDLE STOP SET ---------------- */
  const handleStop = () => {
    stop();

    if (elapsed <= 0) return;

    const newSet: CompletedSet = {
      setNumber: sets.length + 1,
      durationSeconds: elapsed,
    };

    engine.completeSet(newSet);

    forceRefresh((v) => v + 1);

    const isLastSet =
      engine.getCompletedSetCount() >= (currentExercise?.sets ?? 0);

    const isLastExercise = !engine.hasNextExercise();

    if (!isLastSet) {
      if (program.autoStartRest) {
        setPhase("rest-set");

        startRestTimer(program.restBetweenSets ?? 15, "rest-set", () => {
          setPhase("active");
          reset();
        });
      } else {
        setPhase("rest-set");
      }
    } else if (!isLastExercise) {
      if (program.autoStartRest) {
        setPhase("rest-exercise");

        startRestTimer(
          program.restBetweenExercises ?? 30,
          "rest-exercise",
          () => handleNextExercise(),
        );
      } else {
        setPhase("rest-exercise");
      }
    } else {
      setPhase("completed");
    }
  };

  /* ---------------- NEXT EXERCISE ---------------- */
  const handleNextExercise = () => {
    if (!engine.hasNextExercise()) return;

    engine.nextExercise();

    clearSets(); // reset hold sets
    reset(); // reset timer

    forceRefresh((v) => v + 1);

    setPhase("active");
  };

  /* ---------------- FINISH WORKOUT ---------------- */
  const handleFinishWorkout = async () => {
    if (!started) return;

    const completedWorkout = engine.finishWorkout();

    if (completedWorkout) await saveCompletedWorkout(completedWorkout);

    setStarted(false);

    clearSets();
    reset();

    setPhase("active");
  };

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      {!started ? (
        <>
          <Text style={styles.title}>Hold Workout</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              engine.startWorkout();
              setStarted(true);
              setPhase("active");
            }}
          >
            <Text style={styles.buttonText}>Start Workout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>
            {currentExercise?.name ?? "Workout Complete 🎉"}
          </Text>

          <Text style={styles.state}>
            {engine.getCompletedSetCount()} / {currentExercise?.sets} sets
          </Text>

          <Text style={styles.currentSet}>Set {currentSetNumber}</Text>

          <Text style={styles.timer}>
            {phase === "active" ? formatTime(elapsed) : `${restTimeLeft}s`}
          </Text>

          {showGetReady && (
            <Animated.Text style={styles.getReadyFlash}>GET READY</Animated.Text>
          )}

          {showGo && <Text style={styles.goFlash}>GO!</Text>}

          <Text style={styles.state}>Phase: {phase.replace("-", " ")}</Text>

          {/* ---------------- HOLD TIMER BUTTONS ---------------- */}
          {currentExercise?.type === "hold" && phase === "active" && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={start}>
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={pause}>
                <Text style={styles.buttonText}>Pause</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={stop}>
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={reset}>
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            style={{ marginTop: 20, width: "100%" }}
            data={sets}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <Text style={styles.setText}>
                Set {index + 1}: {formatTime(item.durationSeconds)}
              </Text>
            )}
          />

          {/* Finish Workout Button */}
          {phase === "completed" && (
            <TouchableOpacity style={styles.button} onPress={handleFinishWorkout}>
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

  currentSet: {
    color: "#00FF00",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  timer: {
    fontSize: 60,
    color: "white",
    marginVertical: 20,
  },

  button: {
    backgroundColor: "#FF6B00",
    paddingVertical: 12,
    paddingHorizontal: 15,
    margin: 5,
    borderRadius: 12,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  state: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },

  setText: {
    color: "#FFD700",
    fontSize: 18,
    marginTop: 5,
    textAlign: "center",
  },

  getReadyFlash: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF3333",
    marginTop: 10,
  },

  goFlash: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#00FF00",
    marginTop: 10,
  },

  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
  },
});
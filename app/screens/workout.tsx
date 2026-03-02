// app/(tabs)/workout.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useHoldTimer } from "../../timers/useHoldTimer";
import { beginnerProgram } from "../../data/beginnerProgram";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { CompletedSet } from "../../models/WorkoutLog";

export default function Workout() {
  const { elapsed, state, sets, start, pause, stop, reset } = useHoldTimer();

  // Initialize Program Engine
  const [engine] = useState(() => new ProgramEngine(beginnerProgram));
  const [started, setStarted] = useState(false);

  // Format seconds into mm:ss
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60).toString().padStart(2, "0");
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Current Exercise
  const currentExercise = engine.getCurrentExercise();

  // Current Set Number
  const currentSetNumber =
    sets.length + (state === "running" || state === "paused" ? 1 : 0);

  // When a hold is completed
  const handleStop = () => {
    stop();

    if (elapsed > 0) {
      const newSet: CompletedSet = {
        setNumber: sets.length + 1,
        durationSeconds: elapsed,
      };

      engine.completeSet(newSet);
    }
  };

 const handleNextExercise = () => {
  if (!engine.hasNextExercise()) return;

  engine.nextExercise();
  reset();
};

const handleFinishWorkout = () => {
  if (!started) return;

  const completedWorkout = engine.finishWorkout();
  console.log("Workout Complete:", completedWorkout);

  setStarted(false);
  reset();
};

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
            }}
          >
            <Text style={styles.buttonText}>Start Workout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
         {/* Exercise Name */}
          <Text style={styles.title}>
            {currentExercise?.name ?? "Workout Complete 🎉"}
          </Text>

          {/* Current Set */}
          <Text style={styles.currentSet}>Set {currentSetNumber}</Text>

          {/* Timer */}
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>

          {/* Start / Pause */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={start}>
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={pause}>
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
          </View>

          {/* Stop / Reset */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleStop}>
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={reset}>
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Next Exercise */}
         <TouchableOpacity
          style={[
            styles.button,
            !engine.hasNextExercise() && { backgroundColor: "#555" },
          ]}
          disabled={!engine.hasNextExercise()}
          onPress={handleNextExercise}
        >
          <Text style={styles.buttonText}>Next Exercise</Text>
        </TouchableOpacity>
                

          {/* Finish Workout */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: started ? "#00AAFF" : "#555" },
            ]}
            disabled={!started}
            onPress={handleFinishWorkout}
          >
            <Text style={styles.buttonText}>Finish Workout</Text>
          </TouchableOpacity>
          {/* Status Info */}
          <Text style={styles.state}>Timer State: {state}</Text>
          <Text style={styles.state}>
            Sets Completed (Timer): {sets.length}
          </Text>

          {/* Completed Sets List */}
          <FlatList
            style={{ marginTop: 20, width: "100%" }}
            data={sets}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <Text style={styles.setText}>
                Set {index + 1}: {formatTime(item.duration)}
              </Text>
            )}
          />
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
  buttonRow: {
    flexDirection: "row",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#FF6B00",
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
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
});
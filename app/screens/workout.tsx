// app/(tabs)/workout.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { useHoldTimer } from "../../timers/useHoldTimer";
import { beginnerProgram } from "../../data/beginnerProgram";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { CompletedSet } from "../../models/WorkoutLog";
import { saveCompletedWorkout } from "../../storage/workoutStorage";

type WorkoutPhase =
  | "active" // performing a set
  | "rest-set" // resting between sets
  | "rest-exercise" // resting between exercises
  | "completed";

export default function Workout() {
  const { elapsed, state, sets, start, pause, stop, reset } = useHoldTimer();

  const [phase, setPhase] = useState<WorkoutPhase>("active");
  const [restTimeLeft, setRestTimeLeft] = useState<number>(0); // countdown for rest

  // Initialize Program Engine
  const [engine] = useState(() => new ProgramEngine(beginnerProgram));
  const [started, setStarted] = useState(false);

  // Track UI refresh
  const [refresh, setRefresh] = useState(0);

  // Format seconds into mm:ss
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Current set number for display
  const totalSets = engine.getCurrentExercise()?.sets ?? 0;

  const currentSetNumber = Math.min(
    engine.getCompletedSetCount() + (phase === "active" ? 1 : 0),
    totalSets,
  );

  // 🔹 Handle phase after completing a set
  const handleSetCompletionPhase = () => {
    const currentExercise = engine.getCurrentExercise();
    if (!currentExercise) return;

    const isLastSet = engine.getCompletedSetCount() >= currentExercise.sets;
    const isLastExercise = !engine.hasNextExercise();

    if (!isLastSet) {
      setPhase("rest-set");
    } else if (!isLastExercise) {
      setPhase("rest-exercise");
    } else {
      setPhase("completed");
    }
  };

  // 🔹 Handle stop of hold timer
  const handleStop = () => {
    stop();

    if (elapsed > 0) {
      const newSet: CompletedSet = {
        setNumber: sets.length + 1,
        durationSeconds: elapsed,
      };

      engine.completeSet(newSet);
      setRefresh((prev) => prev + 1);

      // Determine next phase
      const currentExercise = engine.getCurrentExercise();
      if (!currentExercise) {
        setPhase("completed");
        return;
      }

      const isLastSet = engine.getCompletedSetCount() >= currentExercise.sets;
      const isLastExercise = !engine.hasNextExercise();

      if (!isLastSet) {
        // Start rest between sets
        if (engine.getProgram().autoStartRest)
          startRestTimer(engine.getProgram().restBetweenSets || 15, "rest-set");
        else setPhase("rest-set");
      } else if (!isLastExercise) {
        // Start rest between exercises
        if (engine.getProgram().autoStartRest)
          startRestTimer(
            engine.getProgram().restBetweenExercises || 30,
            "rest-exercise",
          );
        else setPhase("rest-exercise");
      } else {
        setPhase("completed");
      }
    }
  };

  // 🔹 Handle next exercise
  const handleNextExercise = () => {
    if (!engine.hasNextExercise()) return;

    engine.nextExercise();
    reset();
    setRefresh((prev) => prev + 1);
    setPhase("active");
  };

  // 🔹 Handle finish workout
  const handleFinishWorkout = async () => {
    if (!started) return;

    const completedWorkout = engine.finishWorkout();
    if (completedWorkout) {
      await saveCompletedWorkout(completedWorkout);
      console.log("Workout Complete:", completedWorkout);
    }

    setStarted(false);
    reset();
    setPhase("active");
  };

  // used fot get ready timer
  const [showGetReady, setShowGetReady] = useState(false);

  const startRestTimer = (
    seconds: number,
    restPhase: "rest-set" | "rest-exercise",
  ) => {
    const program = engine.getProgram();
    const getReadySeconds = program.getReadyCountdownSeconds ?? 3;

    setPhase(restPhase);
    setRestTimeLeft(seconds);
    setShowGetReady(false);

    const interval = setInterval(() => {
      setRestTimeLeft((prev) => {
        const nextValue = prev - 1;

        // 🔥 Trigger GET READY
        if (nextValue === getReadySeconds) {
          setShowGetReady(true);

          // 🔊 Optional sound (we'll wire real sound later)
          if (program.playRestSound) {
            console.log("🔔 Get Ready Sound Trigger");
          }
        }

        if (nextValue <= 0) {
          clearInterval(interval);
          setShowGetReady(false);

          if (restPhase === "rest-set") {
            setPhase("active");
            reset();
          } else {
            handleNextExercise();
          }

          return 0;
        }

        return nextValue;
      });
    }, 1000);
  };

  //  const currentExercise = engine.getCurrentExercise();

  const program = engine.getProgram();

  const totalRestTime =
    phase === "rest-set"
      ? (program.restBetweenSets ?? 15)
      : phase === "rest-exercise"
        ? (program.restBetweenExercises ?? 30)
        : 0;

  const restProgressPercent =
    totalRestTime > 0 ? (restTimeLeft / totalRestTime) * 100 : 0;

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
          {/* Exercise Name */}
          <Text style={styles.title}>
            {engine.getCurrentExercise()?.name ?? "Workout Complete 🎉"}
          </Text>

          <Text style={styles.state}>
            {engine.getCompletedSetCount()} /{" "}
            {engine.getCurrentExercise()?.sets} sets
          </Text>

          {/* Current Set */}
          <Text style={styles.currentSet}>Set {currentSetNumber}</Text>

          {/* Timer */}
          <Text style={styles.timer}>
            {phase === "active" ? formatTime(elapsed) : `${restTimeLeft}s`}
          </Text>

          {/* GET READY flash */}
          {showGetReady && <Text style={styles.getReadyFlash}>GET READY</Text>}

          <Text style={styles.state}>Phase: {phase.replace("-", " ")}</Text>

          {phase !== "active" && phase !== "completed" && (
            <View style={styles.restContainer}>
              <View
                style={[
                  styles.restProgress,
                  { width: `${restProgressPercent}%` },
                ]}
              />
            </View>
          )}

          {/* Start / Pause */}
          {phase === "active" && (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={start}>
                  <Text style={styles.buttonText}>Start</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={pause}>
                  <Text style={styles.buttonText}>Pause</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    engine.isCurrentExerciseComplete() && {
                      backgroundColor: "#555",
                    },
                  ]}
                  disabled={engine.isCurrentExerciseComplete()}
                  onPress={handleStop}
                >
                  <Text style={styles.buttonText}>Stop</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={reset}>
                  <Text style={styles.buttonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Next Exercise */}
          <TouchableOpacity
            style={[
              styles.button,
              (!engine.isCurrentExerciseComplete() || phase !== "active") && {
                backgroundColor: "#555",
              },
            ]}
            disabled={!engine.isCurrentExerciseComplete() || phase !== "active"}
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
          <Text style={styles.state}>Phase: {phase}</Text>
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
  restContainer: {
    width: "100%",
    height: 20,
    backgroundColor: "#333",
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 15,
  },
  restProgress: {
    height: "100%",
    backgroundColor: "#00FF88",
  },
  getReadyFlash: {
  fontSize: 32,
  fontWeight: "bold",
  color: "#FF3333",
  marginTop: 15,
  textAlign: "center",
},
});

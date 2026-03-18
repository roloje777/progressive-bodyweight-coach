// app/screens/Workout.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";

import { appStyles as styles } from "../styles/appStyles";

import { useWorkoutTimer } from "../../timers/useWorkoutTimer";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { beginnerProgram } from "../../data/beginnerProgram";
import { HoldExercise } from "../components/HoldExercise";
import { RepsExercise } from "../components/RepsExercise";
import { TempoExercise } from "../components/TempoExercise";

import { Exercise, TempoConfig, RepConfig } from "../../models/Exercise";
import { CompletedSet } from "../../models/WorkoutLog";
import { estimateWorkoutDuration } from "../utils/estimateWorkoutDuration";

type WorkoutSet =
  | { reps: number; phaseDurations?: number[] }
  | { durationSeconds: number };

export default function Workout() {
  const [engine] = useState(() => new ProgramEngine(beginnerProgram));

  const program = engine.getProgram();
  const day = program.days[0]; // current day

  const formatDateTime = () => {
    const now = new Date();
    return now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("en-GB");
  };

  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<
    "active" | "rest-set" | "rest-exercise" | "completed"
  >("active");
  const [, forceRefresh] = useState(0);

  const { restTimeLeft, startRestTimer } = useWorkoutTimer({
    getReadySeconds: 3,
    enableSound: true,
    enableVibration: true,
  });

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Nullable Exercise for TypeScript ---
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(
    engine.getCurrentExercise(),
  );

  const [sets, setSets] = useState<WorkoutSet[]>([]);

 const nextExercise = currentExercise
  ? engine.getNextExercise()
  : null;

  const estimatedMinutes = estimateWorkoutDuration(
    day,
    program.restBetweenSets,
    program.restBetweenExercises,
  );

  // --- Timer Controls ---
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

  /** Handle completion of Reps set */
  const completeRepsSet = (reps: number) => {
    if (!currentExercise) return;

    const newSet: WorkoutSet = { reps };
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);

    engine.completeSet({
      setNumber: updatedSets.length,
      repsCompleted: reps,
    });

    checkSetCompletion(updatedSets);
  };

  /** Handle completion of Tempo set */
  const completeTempoSet = (set: {
    reps: number;
    phaseDurations: number[];
  }) => {
    if (!currentExercise) return;

    const newSet: WorkoutSet = set;
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);

    engine.completeSet({
      setNumber: updatedSets.length,
      repsCompleted: set.reps,
      phaseDurations: set.phaseDurations,
    });

    checkSetCompletion(updatedSets);
  };

  /** Check if we need to move to next set/exercise */
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
      setCurrentExercise(null);
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

     forceRefresh((x) => x + 1);
  };

  const handleFinishWorkout = () => {
    const completedWorkout = engine.finishWorkout();

    if (!completedWorkout) return;

    router.push({
      pathname: "/screens/workoutSummary",
      params: {
        workout: JSON.stringify(completedWorkout),
      },
    });
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
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* TITLE */}
          <Text style={styles.title}>Workout</Text>

          {/* DATE */}
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>

          {/* PROGRAM INFO */}
          <View style={styles.programInfo}>
            <Text style={styles.dayTitle}>{day.title}</Text>
            <Text style={styles.programLevel}>{program.name}</Text>
          </View>

          {/* EXERCISE LIST */}
          <View style={styles.exerciseList}>
            {day.exercises.map((ex) => (
              <View key={ex.id} style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>{ex.name}</Text>

                <View style={styles.exerciseMeta}>
                  <Text style={styles.exerciseType}>Type: {ex.type}</Text>
                  <Text style={styles.exerciseSets}>Sets: {ex.sets}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ESTIMATED TIME */}
          <Text style={styles.estimateText}>
            Estimated Workout Time: ~{estimatedMinutes} min
          </Text>

          {/* START BUTTON */}
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
        </ScrollView>
      ) : (
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 40, alignItems: "center" }}
          showsVerticalScrollIndicator={true}
        >
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
            <View style={styles.visualContainer}>
              <Text style={styles.phaseText}>
                {phase === "rest-set"
                  ? "Rest Between Sets"
                  : "Rest Between Exercises"}
              </Text>

              <Text style={styles.bigTimer}>{restTimeLeft}s</Text>

              {/* 👇 NEW: Show next exercise */}
              {phase === "rest-exercise" && nextExercise && (
                <View style={{ marginTop: 20, alignItems: "center" }}>
                  <Text style={{ color: "#aaa", fontSize: 14 }}>
                    Next Exercise
                  </Text>

                  <Text
                    style={{
                      color: "#FFD700",
                      fontSize: 22,
                      fontWeight: "bold",
                      marginTop: 5,
                      textAlign: "center",
                    }}
                  >
                    {nextExercise.name}
                  </Text>

                  <Text style={{ color: "#ccc", marginTop: 5 }}>
                    {nextExercise.sets} sets • {nextExercise.type}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TEMPO EXERCISE */}
          {currentExercise?.type === "tempo" && phase === "active" && (
            <TempoExercise
              exerciseName={currentExercise.name}
              totalSets={currentExercise.sets}
              config={currentExercise.config as TempoConfig}
              minReps={(currentExercise.config as TempoConfig).minReps}
              maxReps={(currentExercise.config as TempoConfig).maxReps}
              sets={sets.filter(
                (s): s is { reps: number; phaseDurations: number[] } =>
                  "reps" in s && "phaseDurations" in s,
              )}
              onCompleteSet={completeTempoSet}
            />
          )}

          {/* HOLD EXERCISE */}
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
                  duration={holdConfig.durationSeconds}
                  sets={sets.filter(
                    (s): s is { durationSeconds: number } =>
                      "durationSeconds" in s,
                  )}
                  onSetComplete={(duration) => {
                    const newSet = { durationSeconds: duration };
                    const updatedSets = [...sets, newSet];
                    setSets(updatedSets);

                    engine.completeSet({
                      setNumber: updatedSets.length,
                      durationSeconds: duration,
                    });

                    checkSetCompletion(updatedSets);
                  }}
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
              onCompleteSet={completeRepsSet}
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
        </ScrollView>
      )}
    </View>
  );
}

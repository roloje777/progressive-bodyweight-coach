// app/screens/Workout.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { router } from "expo-router";

import { appStyles as styles } from "../styles/appStyles";

import { useWorkoutTimer } from "../../timers/useWorkoutTimer";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { beginnerProgram } from "../../data/beginnerProgram";
import { HoldExercise } from "../components/HoldExercise";
import { RepsExercise } from "../components/RepsExercise";
import { TempoExercise } from "../components/TempoExercise";

import { Exercise, TempoConfig, RepConfig } from "../../models/Exercise";
import { estimateWorkoutDuration } from "../utils/estimateWorkoutDuration";
import { resolveConfig } from "../utils/resolveConfig";

type WorkoutSet =
  | { reps: number; phaseDurations?: number[] }
  | { durationSeconds: number };

export default function Workout() {
  const [engine] = useState(() => new ProgramEngine(beginnerProgram));

  const program = engine.getProgram();
  const config = resolveConfig(program);
  const day = program.days[0];

  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<
    "active" | "rest-set" | "rest-exercise" | "completed"
  >("active");

  const [, forceRefresh] = useState(0);
 const alertThreshold = config.countdownAlertThreshold;

  const { restTimeLeft, startRestTimer } = useWorkoutTimer({
    getReadySeconds: config.getReadyCountdownSeconds ?? 3,
    enableSound: config.playRestSound ?? true,
    enableVibration: config.enableVibration ?? true,
  });

  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(
    engine.getCurrentExercise(),
  );

  const [sets, setSets] = useState<WorkoutSet[]>([]);

  const nextExercise = currentExercise ? engine.getNextExercise() : null;

  // ✅ NEW: Exercise Icon Helper
  const getExerciseIcon = (type: string) => {
    switch (type) {
      case "tempo":
        return "⏱";
      case "reps":
        return "🔢";
      case "hold":
        return "⏳";
      default:
        return "🏋️";
    }
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const goAnim = useRef(new Animated.Value(0)).current;

 const estimatedMinutes = React.useMemo(() => {
  return estimateWorkoutDuration(
    day,
    config.restBetweenSets,
    config.restBetweenExercises,
  );
}, [day, config.restBetweenSets, config.restBetweenExercises]);

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

  const checkSetCompletion = (updatedSets: WorkoutSet[]) => {
    if (!currentExercise) return;

    const isLastSet = updatedSets.length >= currentExercise.sets;
    const isLastExercise = !engine.hasNextExercise();

    if (!isLastSet) {
      setPhase("rest-set");
      startRestTimer(config.restBetweenSets ?? 20, "rest-set", () =>
        setPhase("active"),
      );
      return;
    }

    if (isLastExercise) {
      setPhase("completed");
      setCurrentExercise(null);
    } else {
      setPhase("rest-exercise");
      startRestTimer(config.restBetweenExercises ?? 30, "rest-exercise", () => {
        // 👇 delay transition so GO animation is visible
        setTimeout(() => {
          handleNextExercise();
        }, 600); // matches GO animation duration
      });
    }
  };

  useEffect(() => {
    if (restTimeLeft <= config.countdownAlertThreshold && restTimeLeft > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1); // reset
    }
  }, [restTimeLeft]);

  useEffect(() => {
    if (restTimeLeft === 0) {
      goAnim.setValue(0);

      Animated.sequence([
        Animated.timing(goAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(goAnim, {
          toValue: 0,
          duration: 300,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [restTimeLeft]);

  const handleNextExercise = () => {
    if (!engine.hasNextExercise()) return;

    engine.nextExercise();
    setCurrentExercise(engine.getCurrentExercise());
    setSets([]);
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

  return (
    <View style={styles.container}>
      {!started ? (
        <ScrollView style={{ width: "100%" }}>
          <Text style={styles.title}>Workout</Text>

          <View style={styles.exerciseList}>
            {day.exercises.map((ex) => (
              <View key={ex.id} style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>
                  {getExerciseIcon(ex.type)} {ex.name}
                </Text>

                <View style={styles.exerciseMeta}>
                  <Text style={styles.exerciseType}>{ex.type}</Text>
                  <Text style={styles.exerciseSets}>{ex.sets} sets</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.estimateText}>
            Estimated Workout Time: ~{estimatedMinutes} min
          </Text>

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
        <ScrollView contentContainerStyle={{ alignItems: "center" }}>
          {currentExercise && (
            <>
              <Text style={styles.title}>
                {getExerciseIcon(currentExercise.type)} {currentExercise.name}
              </Text>
              <Text style={styles.state}>
                {sets.length} / {currentExercise.sets} sets
              </Text>
            </>
          )}

          {/* ✅ UPDATED REST UI */}
          {phase !== "active" && phase !== "completed" && (
            <View style={styles.visualContainer}>
              {phase === "rest-set" ? (
                <>
                  <Text style={styles.phaseText}>Rest Between Sets</Text>

                  <Animated.Text
                    style={[
                      styles.bigTimer,
                      {
                        color:
                          restTimeLeft <= alertThreshold ? "#FF4C4C" : "#fff",
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    {restTimeLeft}s
                  </Animated.Text>
                </>
              ) : (
                <>
                  <Text style={{ color: "#aaa", fontSize: 16 }}>Up Next</Text>

                  {nextExercise && (
                    <>
                      <Text
                        style={{
                          color: "#FFD700",
                          fontSize: 26,
                          fontWeight: "bold",
                          marginTop: 10,
                          textAlign: "center",
                        }}
                      >
                        {getExerciseIcon(nextExercise.type)} {nextExercise.name}
                      </Text>

                      <Text style={{ color: "#ccc", marginTop: 5 }}>
                        {nextExercise.sets} sets • {nextExercise.type}
                      </Text>
                    </>
                  )}

                  <Text style={{ color: "#aaa", fontSize: 16, marginTop: 20 }}>
                    Starting in...
                  </Text>

                  <Animated.Text
                    style={[
                      styles.bigTimer,
                      {
                        color:
                          restTimeLeft <= alertThreshold ? "#FF4C4C" : "#fff",
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    {restTimeLeft}s
                  </Animated.Text>
                </>
              )}

              {/* 🔥 ANIMATED GO */}
              {restTimeLeft === 0 && (
                <Animated.Text
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: "#4CAF50",
                    marginTop: 10,
                    opacity: goAnim,
                    transform: [
                      {
                        scale: goAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.5],
                        }),
                      },
                    ],
                  }}
                >
                  GO!
                </Animated.Text>
              )}
            </View>
          )}
          {/* EXERCISE COMPONENTS */}
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

          {currentExercise?.type === "hold" && phase === "active" && (
            <HoldExercise
              exerciseName={currentExercise.name}
              totalSets={currentExercise.sets}
              duration={(currentExercise.config as any).durationSeconds}
              sets={sets as any}
              onSetComplete={(duration) => {
                const updated = [...sets, { durationSeconds: duration }];
                setSets(updated);

                engine.completeSet({
                  setNumber: updated.length,
                  durationSeconds: duration,
                });

                checkSetCompletion(updated);
              }}
            />
          )}

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

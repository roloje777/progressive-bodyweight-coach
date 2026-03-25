// app/screens/Workout.tsx
import { useLocalSearchParams, router } from "expo-router";
import { useProgress } from "@/hooks/useProgress";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

import { appStyles as styles } from "../../styles/appStyles";

import { HoldExercise } from "../../components/HoldExercise";
import { RepsExercise } from "../../components/RepsExercise";
import { TempoExercise } from "../../components/TempoExercise";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { useWorkoutTimer } from "../../timers/useWorkoutTimer";

import { Exercise, RepConfig, TempoConfig } from "../../models/Exercise";
import { soundManager } from "../../services/SoundManagerExpoAv";
import { estimateWorkoutDuration } from "../../utils/estimateWorkoutDuration";
import { resolveConfig } from "../../utils/resolveConfig";

type WorkoutSet =
  | { reps: number; phaseDurations?: number[] }
  | { durationSeconds: number };

export default function Workout() {
  const params = useLocalSearchParams();
  const { program } = useProgress();

  const dayIndex = Number(params.dayIndex ?? 0);
  const engineRef = useRef(new ProgramEngine(program, dayIndex));
  const engine = engineRef.current;
  const day = program.days[dayIndex];
  const config = resolveConfig(program);

  const [soundReady, setSoundReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await soundManager.loadSounds();
      setSoundReady(true);
    };
    init();
  }, []);

  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<
    "active" | "rest-set" | "rest-exercise" | "completed"
  >("active");

  const [, forceRefresh] = useState(0);
  const alertThreshold = config.countdownAlertThreshold ?? 5;

  const { restTimeLeft, startRestTimer } = useWorkoutTimer();

  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(
    engine.getCurrentExercise(),
  );
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const nextExercise = currentExercise ? engine.getNextExercise() : null;

  // Animated values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const goAnim = useRef(new Animated.Value(0)).current;

  const estimatedMinutes = React.useMemo(() => {
    return estimateWorkoutDuration(
      day,
      config.restBetweenSets,
      config.restBetweenExercises,
    );
  }, [day, config.restBetweenSets, config.restBetweenExercises]);

  // Exercise Icon Helper
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

  // Complete Sets
  const completeRepsSet = (reps: number) => {
    if (!currentExercise) return;
    if (sets.length >= currentExercise.sets) return; // ✅ prevent overflow

    const newSet: WorkoutSet = { reps };
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);

    engine.completeSet({ setNumber: updatedSets.length, repsCompleted: reps });
    checkSetCompletion(updatedSets);
  };

  const completeTempoSet = (set: {
    reps: number;
    phaseDurations: number[];
  }) => {
    if (!currentExercise) return;
    if (sets.length >= currentExercise.sets) return;

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

  const completeHoldSet = (duration: number) => {
    if (!currentExercise) return;
    if (sets.length >= currentExercise.sets) return;

    const updated = [...sets, { durationSeconds: duration }];
    setSets(updated);

    engine.completeSet({
      setNumber: updated.length,
      durationSeconds: duration,
    });
    checkSetCompletion(updated);
  };

  // Handle Rest / Next Exercise
  const handleRestStart = async (
    duration: number,
    type: "rest-set" | "rest-exercise",
  ) => {
    if (config.playRestSound) {
      const isHold = currentExercise?.type === "hold";

      // ✅ PLAY STOP ONLY FOR HOLD
      if (isHold) {
        await soundManager.playStop(true);
      }

      // ✅ ALWAYS FOLLOW WITH REST BEFORE
      await soundManager.playRestBeforeX(type);
    }

    startRestTimer(
      duration,
      (next) => {
        // ✅ Tick logic
        console.log("config.playRestSound = " + config.playRestSound);
        if (next === config.getReadyCountdownSeconds) {
          if (config.playRestSound) soundManager.playGetReady();
          if (config.enableVibration) Vibration.vibrate(150);
        }

        if (next <= alertThreshold && next > 0) {
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
        }
      },
      () => {
        // ✅ Complete logic
        setPhase("active");

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

        // if (config.playRestSound) {
        //   type === "rest-set"
        //     ? soundManager.playNextSet(true)
        //     : soundManager.playNextExercise(true);
        // }
        if (config.playRestSound) {
          soundManager.playBeforeNextX(type);
        }

        if (config.enableVibration) Vibration.vibrate(150);

        // 🔥 IMPORTANT (you were missing this!)
        if (type === "rest-exercise") {
          handleNextExercise();
        }
      },
    );
  };

  const checkSetCompletion = (updatedSets: WorkoutSet[]) => {
    if (!currentExercise) return;

    const isLastSet = updatedSets.length >= currentExercise.sets;
    const isLastExercise = !engine.hasNextExercise();

    if (!isLastSet) {
      setPhase("rest-set");
      handleRestStart(config.restBetweenSets ?? 20, "rest-set");
      return;
    }

    if (isLastExercise) {
      setPhase("completed");
      setCurrentExercise(null);
    } else {
      setPhase("rest-exercise");
      handleRestStart(config.restBetweenExercises ?? 30, "rest-exercise");
    }
  };

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

    // soundManager.playWorkoutComplete(true);

    router.push({
      pathname: "/screens/staticStretch",
      params: {
        dayIndex,
        workout: JSON.stringify(completedWorkout),
      },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ padding: 20, backgroundColor: "red" }}
        onPress={() => {
          console.log("🔥 TEST BUTTON PRESSED");
          soundManager.playWorkoutComplete(true);
        }}
      >
        <Text style={{ color: "white" }}>TEST SOUND</Text>
      </TouchableOpacity>
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
            disabled={!soundReady}
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
              <Text style={styles.exerciseDescription}>
                {currentExercise.description}
              </Text>
              <Text style={styles.state}>
                {sets.length} / {currentExercise.sets} sets
              </Text>
            </>
          )}

          {/* REST UI */}
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

          {/* Exercise Components */}
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
              onSetComplete={completeHoldSet}
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

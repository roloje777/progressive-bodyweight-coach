// app/screens/Workout.tsx
import { useLocalSearchParams, router } from "expo-router";
import { useProgress } from "@/hooks/useProgress";
import React, { useEffect, useRef, useState, useMemo } from "react";
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

import { logWorkoutState } from "@/utils/debugWorkout";
import { assert } from "@/utils/assert";

type WorkoutSet =
  | { reps: number; phaseDurations?: number[] }
  | { durationSeconds: number };

export default function Workout() {
  const params = useLocalSearchParams();
  const { program, week, isLoaded } = useProgress();

  const session = JSON.parse(params.session as string);
  const blockIndex = Number(params.blockIndex ?? 0);
  const dayIndex = session.dayIndex;

  assert(!isNaN(dayIndex), "dayIndex is NaN");

  const currentBlock = session.blocks[blockIndex];

  // ✅ Always define hooks BEFORE any return
  const config = resolveConfig(program);

  const [soundReady, setSoundReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<
    "active" | "rest-set" | "rest-exercise" | "completed"
  >("active");
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [, forceRefresh] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const goAnim = useRef(new Animated.Value(0)).current;

  const { restTimeLeft, startRestTimer } = useWorkoutTimer();

  const alertThreshold = config.countdownAlertThreshold ?? 5;

  // ✅ Engine only for MAIN block
  const engine = useMemo(() => {
    if (!program || currentBlock.type !== "main") return null;
    return new ProgramEngine(program, dayIndex);
  }, [program, dayIndex, currentBlock.type]);

  // ✅ Effects
  useEffect(() => {
    if (!isLoaded) return;
    logWorkoutState("WORKOUT SCREEN", program, week, dayIndex);
  }, [isLoaded, program, week, dayIndex]);

  useEffect(() => {
    const init = async () => {
      await soundManager.loadSounds();
      setSoundReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (engine) {
      setCurrentExercise(engine.getCurrentExercise());
    }
  }, [engine]);

  // ✅ EARLY RETURN (AFTER HOOKS)
  if (currentBlock.type !== "main") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{currentBlock.title}</Text>

        <ScrollView>
          {currentBlock.exercises.map((ex: any) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.replace({
              pathname: "/screens/workoutRunner",
              params: {
                session: params.session,
                blockIndex: String(blockIndex + 1),
              },
            })
          }
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Safety (TS happy)
  if (!engine) return null;

  const nextExercise = currentExercise
    ? engine.getNextExercise()
    : null;

  const estimatedMinutes = estimateWorkoutDuration(
    currentBlock,
    config.restBetweenSets,
    config.restBetweenExercises
  );

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

  const completeRepsSet = (reps: number) => {
    if (!currentExercise) return;
    if (sets.length >= currentExercise.sets) return;

    const updated = [...sets, { reps }];
    setSets(updated);

    engine.completeSet({
      setNumber: updated.length,
      repsCompleted: reps,
    });

    checkSetCompletion(updated);
  };

  const completeTempoSet = (set: {
    reps: number;
    phaseDurations: number[];
  }) => {
    if (!currentExercise) return;

    const updated = [...sets, set];
    setSets(updated);

    engine.completeSet({
      setNumber: updated.length,
      repsCompleted: set.reps,
      phaseDurations: set.phaseDurations,
    });

    checkSetCompletion(updated);
  };

  const completeHoldSet = (duration: number) => {
    if (!currentExercise) return;

    const updated = [...sets, { durationSeconds: duration }];
    setSets(updated);

    engine.completeSet({
      setNumber: updated.length,
      durationSeconds: duration,
    });

    checkSetCompletion(updated);
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

    const updatedSession = {
      ...session,
      results: {
        ...session.results,
        workout: completedWorkout,
      },
    };

    router.replace({
      pathname: "/screens/workoutRunner",
      params: {
        session: JSON.stringify(updatedSession),
        blockIndex: String(blockIndex + 1),
      },
    });
  };

  const checkSetCompletion = (updatedSets: WorkoutSet[]) => {
    if (!currentExercise) return;

    const isLastSet = updatedSets.length >= currentExercise.sets;
    const isLastExercise = !engine.hasNextExercise();

    if (!isLastSet) {
      setPhase("rest-set");
      startRestTimer(config.restBetweenSets ?? 20);
      return;
    }

    if (isLastExercise) {
      setPhase("completed");
      setCurrentExercise(null);
    } else {
      setPhase("rest-exercise");
      startRestTimer(config.restBetweenExercises ?? 30, handleNextExercise);
    }
  };

  return (
    <View style={styles.container}>
      {!started ? (
        <ScrollView>
          <Text style={styles.title}>Workout</Text>

          {currentBlock.exercises.map((ex: any) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>
                {getExerciseIcon(ex.type)} {ex.name}
              </Text>
              <Text>{ex.sets} sets</Text>
            </View>
          ))}

          <Text>Estimated: ~{estimatedMinutes} min</Text>

          <TouchableOpacity
            style={styles.button}
            disabled={!soundReady}
            onPress={() => {
              engine.startWorkout();
              setStarted(true);
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
              <Text style={styles.title}>{currentExercise.name}</Text>
              <Text>
                {sets.length} / {currentExercise.sets}
              </Text>
            </>
          )}

          {currentExercise?.type === "reps" && (
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
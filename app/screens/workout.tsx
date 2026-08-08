// app/screens/Workout.tsx
import { useLocalSearchParams, router } from "expo-router";
import { useProgress } from "@/hooks/useProgress";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  TouchableOpacity,
  Text,
  Vibration,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import PrimaryButton from "@/components/PrimaryButton";
import WorkoutMenu from "@/components/WorkoutMenu";
import { appStyles as styles } from "../../styles/appStyles";
// import { soundManager } from "@/services/SoundManagerExpoAv";
import { soundManager } from "@/services/SoundManager";
import { HoldExercise } from "../../components/HoldExercise";
import { RepsExercise } from "../../components/RepsExercise";
import { TempoExercise } from "../../components/TempoExercise";
import { ProgramEngine } from "../../engine/ProgramEngine";
import { useWorkoutTimer } from "../../timers/useWorkoutTimer";

import {
  HydratedExercise,
  RepConfig,
  TempoConfig,
  ProgramExercise,
} from "../../models/Exercise";
import { estimateWorkoutDuration } from "../../utils/estimateWorkoutDuration";
import { resolveConfig } from "../../utils/resolveConfig";

import { logWorkoutState } from "@/utils/debugWorkout";
import { assert } from "@/utils/assert";
import AppIcon from "../../components/AppIcon";
import { calculateWorkoutStats } from "@/utils/calculateWorkoutStats";
import TopAppBar from "@/components/TopAppBar";
import { getWorkoutHistory } from "@/storage/workoutStorage";
import { getNextExerciseConfig } from "@/engine/ProgressEngine";
import { CompletedSession, CompletedSet } from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";
import WorkoutProgress from "@/components/WorkoutProgress";

type WorkoutSet =
  | {
      reps: number | { left: number; right: number };
      phaseDurations?: number[];
    }
  | {
      durationSeconds: number;
    }
  | {
      durationLeft: number;
      durationRight: number;
    }
  | {
      skipped: true;
    };

export default function Workout() {
  const [workoutHistory, setWorkoutHistory] = useState<CompletedSession[]>([]);
  const params = useLocalSearchParams();
  const startWorkoutTimeParam = params.startWorkoutTimeParam as string;
  console.log("Workout startWorkoutTimeParam" + startWorkoutTimeParam);
  const { program, week, day: currentDayIndex, isLoaded } = useProgress();

  // const session = JSON.parse(params.session as string);
  const [session, setSession] = useState(() =>
    JSON.parse(params.session as string),
  );
  const blockIndex = Number(params.blockIndex ?? 0);

  const dayIndex = session.dayIndex;

  assert(!isNaN(dayIndex), "dayIndex is NaN from route params");

  const currentBlock = session.blocks[blockIndex];

  // ✅ SAFE ENGINE (always runs)
  const engine = React.useMemo(() => {
    if (!program || !program.days || !program.days[dayIndex]) {
      return null;
    }
    return new ProgramEngine(program, dayIndex);
  }, [program, dayIndex]);

  // ✅ ALL HOOKS MUST BE ABOVE RETURNS
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<
    "active" | "rest-set" | "rest-exercise" | "completed"
  >("active");
  // const [, forceRefresh] = useState(0);

  const { restTimeLeft, startRestTimer } = useWorkoutTimer();

  // const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentExercise, setCurrentExercise] =
    useState<HydratedExercise | null>(null);
  const [nextExercise, setNextExercise] = useState<HydratedExercise | null>(
    null,
  );

  const [sets, setSets] = useState<WorkoutSet[]>([]);

  const [menuVisible, setMenuVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const goAnim = useRef(new Animated.Value(0)).current;

  const config = resolveConfig(program);
  const alertThreshold = config.countdownAlertThreshold ?? 5;

  // ✅ Effects
  useEffect(() => {
    if (!isLoaded) return;
    logWorkoutState("WORKOUT SCREEN", program, week, dayIndex);
  }, [isLoaded, program, week, dayIndex]);

  useEffect(() => {
    if (!engine) return;

    syncExercisesFromEngine();
  }, [engine]);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getWorkoutHistory();
      setWorkoutHistory(history);
    };

    loadHistory();
  }, []);

  // when workout complete move to next screen
  useEffect(() => {
    if (phase !== "completed") return;

    handleFinishWorkout();
  }, [phase]);

  function syncExercisesFromEngine() {
    if (!engine) return;

    const current = engine.getCurrentExercise();
    const next = engine.getNextExercise();

    setCurrentExercise(
      current ? getNextExerciseConfig(current, workoutHistory) : null,
    );

    setNextExercise(next ? getNextExerciseConfig(next, workoutHistory) : null);
  }

  const workoutDay = currentBlock;

  const stats = React.useMemo(() => {
    if (!workoutDay?.exercises) return { effectiveness: 0, difficulty: 0 };
    return calculateWorkoutStats(workoutDay.exercises);
  }, [workoutDay]);

  const estimatedMinutes = React.useMemo(() => {
    return estimateWorkoutDuration(
      workoutDay,
      config.restBetweenSets,
      config.restBetweenExercises,
    );
  }, [workoutDay, config.restBetweenSets, config.restBetweenExercises]);

  // ---------------------------------
  // ADAPTIVE PERFORMANCE RANGES
  // ---------------------------------
  const adaptiveMinReps =
    currentExercise?.performanceProfile?.recommendedRange.min;

  const adaptiveMaxReps =
    currentExercise?.performanceProfile?.recommendedRange.max;

  const minReps =
    adaptiveMinReps ??
    (currentExercise?.config as RepConfig | TempoConfig)?.minReps;

  const maxReps =
    adaptiveMaxReps ??
    (currentExercise?.config as RepConfig | TempoConfig)?.maxReps;

  if (!program || !program.days || !program.days[dayIndex]) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading workout...</Text>
      </View>
    );
  }

  // ✅ HANDLE NON-MAIN BLOCKS EARLY
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

        <PrimaryButton
          title="Continue"
          onPress={() =>
            router.replace({
              pathname: "/screens/workoutRunner",
              params: {
                session: params.session,
                blockIndex: String(blockIndex + 1),
                startWorkoutTime: startWorkoutTimeParam, // Expo Router params are strings
              },
            })
          }
        />
      </View>
    );
  }

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

  const completeRepsSet = (reps: number | { left: number; right: number }) => {
    if (!currentExercise) return;
    if (sets.length >= currentExercise.sets) return;

    finalizeSet(
      { reps },
      {
        setNumber: sets.length + 1,
        reps,
      },
    );
  };


  const completeTempoSet = (set: {
    reps: number | { left: number; right: number };
    phaseDurations: number[];
  }) => {
    if (!currentExercise) return;
    if (sets.length >= currentExercise.sets) return;

    finalizeSet(set, {
      setNumber: sets.length + 1,
      reps: set.reps,
      phaseDurations: set.phaseDurations,
    });
  };

 
  const completeHoldSet = (
    duration: number | { left: number; right: number },
  ) => {
    if (!currentExercise) return;
    if (sets.length >= currentExercise.sets) return;

    if (typeof duration === "object") {
      finalizeSet(
        {
          durationLeft: duration.left,
          durationRight: duration.right,
        },
        {
          setNumber: sets.length + 1,
          durationLeft: duration.left,
          durationRight: duration.right,
        },
      );
    } else {
      finalizeSet(
        {
          durationSeconds: duration,
        },
        {
          setNumber: sets.length + 1,
          durationSeconds: duration,
        },
      );
    }
  };

  const finalizeSet = (
    uiSet: WorkoutSet,
    completedSet: Omit<CompletedSet, "status">,
  ) => {
    const updatedSets = [...sets, uiSet];

    setSets(updatedSets);

    if (engine) {
      engine.completeSet({
        status: ItemStatus.Completed,
        ...completedSet,
      });
    }

    checkSetCompletion(updatedSets, ItemStatus.Completed);
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
        // console.log("config.playRestSound = " + config.playRestSound);
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

  const checkSetCompletion = (
    updatedSets: WorkoutSet[],
    lastStatus: ItemStatus,
  ) => {
    if (!currentExercise) return;
    if (!engine) return;

    const isLastSet = updatedSets.length >= currentExercise.sets;
    const isLastExercise = !engine.hasNextExercise();

    // ------------------------
    // More sets remain
    // ------------------------
    if (!isLastSet) {
      // Skipped set → continue immediately
      if (lastStatus === ItemStatus.Skipped) {
        setPhase("active");
        return;
      }

      // Completed set → rest before next set
      setPhase("rest-set");
      handleRestStart(config.restBetweenSets ?? 20, "rest-set");
      return;
    }

    // ------------------------
    // Exercise complete
    // ------------------------
    if (isLastExercise) {
      // Last exercise of workout → finish immediately
      setCurrentExercise(null);
      setNextExercise(null);
      setPhase("completed");
      return;
    }

    // Exercise finished (completed OR skipped)
    // → rest before next exercise
    setPhase("rest-exercise");
    handleRestStart(config.restBetweenExercises ?? 30, "rest-exercise");
  };

  const handleNextExercise = () => {
    if (!engine || !engine.hasNextExercise()) return;

    engine.nextExercise();

    syncExercisesFromEngine();

    setSets([]);
    setPhase("active");
  };

  // const finishingRef = useRef(false);

  const handleFinishWorkout = () => {
    if (!engine) return;

    if (!engine) return;

    const completedWorkout = engine.finishWorkout();
    if (!completedWorkout) return;

    setWorkoutHistory((prev) => [...prev, completedWorkout]);

    const updatedBlocks = [...session.blocks];

    const updatedSession = {
      ...session,
      blocks: updatedBlocks,
      results: {
        ...session.results,
        workout: completedWorkout,
      },
    };

    router.replace({
      pathname: "/screens/workoutRunner",
      params: {
        session: JSON.stringify(updatedSession),
        blockIndex: String(Number(params.blockIndex) + 1),
        startWorkoutTime: startWorkoutTimeParam, // Expo Router params are strings
      },
    });
  };

  // skips the set
  const handleSkipSet = () => {
    if (!currentExercise) return;

    const skippedSet: WorkoutSet = {
      skipped: true,
    };

    const updatedSets = [...sets, skippedSet];

    setSets(updatedSets);

    engine?.completeSet({
      setNumber: updatedSets.length,
      status: ItemStatus.Skipped,
    });

    checkSetCompletion(updatedSets, ItemStatus.Skipped);
  };

  // skips the entire exercise
  // const handleSkipExercise = () => {
  //   if (!currentExercise) return;
  //   if (!engine) return;

  //   const remainingSets = currentExercise.sets - sets.length;

  //   if (remainingSets <= 0) return;

  //   const updatedSets = [
  //     ...sets,
  //     ...Array.from(
  //       { length: remainingSets },
  //       () => ({ skipped: true }) as WorkoutSet,
  //     ),
  //   ];

  //   setSets(updatedSets);

  //   // Record every remaining set as skipped
  //   for (let i = 0; i < remainingSets; i++) {
  //     engine.completeSet({
  //       setNumber: sets.length + i + 1,
  //       status: ItemStatus.Skipped,
  //     });
  //   }

  //   // The exercise is now complete.
  //   // IMPORTANT: do not use the normal set-rest logic here.
  //   if (engine.hasNextExercise()) {
  //     setPhase("rest-exercise");
  //     handleRestStart(config.restBetweenExercises ?? 30, "rest-exercise");
  //   } else {
  //     setCurrentExercise(null);
  //     setNextExercise(null);
  //     setPhase("completed");
  //   }
  // };
  const handleSkipExercise = () => {
  if (!currentExercise) return;
  if (!engine) return;

  const remainingSets = currentExercise.sets - sets.length;

  if (remainingSets <= 0) return;

  const updatedSets = [
    ...sets,
    ...Array.from(
      { length: remainingSets },
      () => ({ skipped: true } as WorkoutSet),
    ),
  ];

  setSets(updatedSets);

  // Record remaining sets as skipped
  for (let i = 0; i < remainingSets; i++) {
    engine.completeSet({
      setNumber: sets.length + i + 1,
      status: ItemStatus.Skipped,
    });
  }

  const hasCompletedSet = sets.some(
    (set) => !("skipped" in set),
  );

  const isLastExercise = !engine.hasNextExercise();

  // Last exercise → finish immediately
  if (isLastExercise) {
    setCurrentExercise(null);
    setNextExercise(null);
    setPhase("completed");
    return;
  }

  // Exercise was completely skipped
  // → no rest, go straight to next exercise
  if (!hasCompletedSet) {
    handleNextExercise();
    return;
  }

  // At least one set was actually completed
  // → normal rest before next exercise
  setPhase("rest-exercise");

  handleRestStart(
    config.restBetweenExercises ?? 30,
    "rest-exercise",
  );
};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Persistent header */}
        <TopAppBar
          effectiveness={stats.effectiveness}
          difficulty={stats.difficulty}
          onMenuPress={() => setMenuVisible(true)}
        />

        <WorkoutProgress blocks={session.blocks} />

        {/* Screen content */}
        {!started ? (
          <ScrollView style={{ width: "100%" }}>
            <Text style={styles.title}>Workout</Text>

            <View style={styles.exerciseList}>
              <Text
                style={{ color: "#FFD700", fontSize: 14, marginBottom: 10 }}
              >
                Tap an exercise for instructions →
              </Text>

              {workoutDay.exercises.map((ex: ProgramExercise) => {
                const hydrated = engine?.hydrateExercise(ex);

                if (!hydrated) return null;

                return (
                  <TouchableOpacity
                    key={hydrated.id}
                    style={styles.exerciseCard}
                    activeOpacity={0.6}
                    onPress={() =>
                      router.push({
                        pathname: "/screens/exerciseGuideScreen",
                        params: { exerciseId: hydrated.id },
                      })
                    }
                  >
                    <Text style={styles.exerciseName}>
                      {getExerciseIcon(hydrated.type)} {hydrated.name}
                    </Text>

                    <View style={styles.exerciseMeta}>
                      <Text style={styles.exerciseType}>{hydrated.type}</Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <AppIcon name="information-circle" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.estimateText}>
              Estimated Workout Time: ~{estimatedMinutes} min
            </Text>

            <PrimaryButton
              title="Start Workout"
              onPress={() => {
                if (!engine) return;

                engine.startWorkout();

                setStarted(true);
                setPhase("active");
                syncExercisesFromEngine();
              }}
            />
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
                          {getExerciseIcon(nextExercise.type)}{" "}
                          {nextExercise.name}
                        </Text>

                        <Text style={{ color: "#ccc", marginTop: 5 }}>
                          {nextExercise.sets} sets • {nextExercise.type}
                        </Text>
                      </>
                    )}

                    <Text
                      style={{
                        color: "#aaa",
                        fontSize: 16,
                        marginTop: 20,
                      }}
                    >
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
                minReps={minReps}
                maxReps={maxReps}
                sideMode={currentExercise.sideMode}
                sets={sets.filter(
                  (
                    s,
                  ): s is {
                    reps: number;
                    phaseDurations: number[];
                  } => "reps" in s && "phaseDurations" in s,
                )}
                onCompleteSet={completeTempoSet}
                matchOrBeatTargets={currentExercise.matchOrBeatTargets}
              />
            )}

            {currentExercise?.type === "hold" && phase === "active" && (
              <HoldExercise
                exerciseName={currentExercise.name}
                totalSets={currentExercise.sets}
                duration={(currentExercise.config as any).durationSeconds}
                sets={sets as any}
                sideMode={currentExercise.sideMode}
                onSetComplete={completeHoldSet}
                matchOrBeatTargets={currentExercise.matchOrBeatTargets}
              />
            )}

            {currentExercise?.type === "reps" && phase === "active" && (
              <RepsExercise
                exerciseName={currentExercise.name}
                totalSets={currentExercise.sets}
                sets={sets.filter((s): s is { reps: any } => "reps" in s)}
                minReps={minReps}
                maxReps={maxReps}
                sideMode={currentExercise.sideMode}
                onCompleteSet={completeRepsSet}
                matchOrBeatTargets={currentExercise.matchOrBeatTargets}
              />
            )}
          </ScrollView>
        )}

        <WorkoutMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onSkipSet={handleSkipSet}
          onSkipExercise={handleSkipExercise}
          onSkipSection={() => console.log("Skip Section")}
          onAbortWorkout={() => console.log("Abort Workout")}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

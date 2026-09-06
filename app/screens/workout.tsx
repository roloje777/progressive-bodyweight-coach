// app/screens/Workout.tsx
import { useLocalSearchParams, router } from "expo-router";
import { useProgress } from "@/hooks/useProgress";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  TouchableOpacity,
  Text,
  Vibration,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
import {
  applyDeloadExercisePrescription,
  getDeloadWorkoutContext,
} from "@/engine/DeloadEngine";
import {
  CompletedSession,
  CompletedSet,
  RecoveryActivity,
  RecoveryActivityType,
} from "@/models/WorkoutLog";
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
  const startWorkoutTime = params.startWorkoutTime as string;

  const {
    program,
    week,
    day: currentDayIndex,
    activeDeload,
    isLoaded,
  } = useProgress();

  const [session, setSession] = useState(() =>
    JSON.parse(params.session as string),
  );

  const blockIndex = Number(params.blockIndex ?? 0);
  const dayIndex = session.dayIndex;

  assert(!isNaN(dayIndex), "dayIndex is NaN from route params");

  const currentBlock = session.blocks[blockIndex];

  // ---------------------------------
  // ENGINE
  // ---------------------------------

  const engine = React.useMemo(() => {
    if (!program || !program.days || !program.days[dayIndex]) {
      return null;
    }

    const prescribedExercises =
      currentBlock?.type === "main"
        ? currentBlock.exercises
        : undefined;

    return new ProgramEngine(program, dayIndex, prescribedExercises);
  }, [program, dayIndex, currentBlock]);

  // ---------------------------------
  // STATE
  // ---------------------------------

  const [started, setStarted] = useState(false);

  const [phase, setPhase] = useState<
    "active" | "rest-set" | "rest-exercise" | "completed"
  >("active");

  const { restTimeLeft, startRestTimer } = useWorkoutTimer();

  const [currentExercise, setCurrentExercise] =
    useState<HydratedExercise | null>(null);

  const [nextExercise, setNextExercise] = useState<HydratedExercise | null>(
    null,
  );

  const [sets, setSets] = useState<WorkoutSet[]>([]);

  // NEW:
  // Tracks whether the whole main workout section was skipped.
  const [sectionSkipped, setSectionSkipped] = useState(false);

  // Pain-recovery main-block choice. This is saved into workout history
  // as recovery metadata rather than as strength performance.
  const [recoveryActivityType, setRecoveryActivityType] =
    useState<RecoveryActivityType>("guided-mobility");
  const [recoveryDurationHours, setRecoveryDurationHours] = useState(0);
  const [recoveryDurationMinutes, setRecoveryDurationMinutes] = useState(10);
  const [recoveryDurationTouched, setRecoveryDurationTouched] = useState(false);
  const [recoveryDistance, setRecoveryDistance] = useState("");
  const [recoveryDistanceUnit, setRecoveryDistanceUnit] = useState<"km" | "mi">("km");
  const [recoveryNotes, setRecoveryNotes] = useState("");
  const [guidedIncludeWarmup, setGuidedIncludeWarmup] = useState(true);
  const [guidedIncludeStretch, setGuidedIncludeStretch] = useState(true);

  const [menuVisible, setMenuVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const goAnim = useRef(new Animated.Value(0)).current;

  const config = resolveConfig(program);
  const alertThreshold = config.countdownAlertThreshold ?? 5;

  const deloadContext = getDeloadWorkoutContext(
    activeDeload,
    program.id,
    week,
  );

  const isReducedDeload =
    deloadContext?.phase === "deload" && deloadContext.reason !== "pain";

  const isPainRecovery =
    deloadContext?.phase === "deload" && deloadContext.reason === "pain";

  const isVerification = deloadContext?.phase === "verification";

  const restBetweenSetsSeconds = Math.ceil(
    (config.restBetweenSets ?? 20) * (deloadContext?.restMultiplier ?? 1),
  );

  const restBetweenExercisesSeconds = Math.ceil(
    (config.restBetweenExercises ?? 30) * (deloadContext?.restMultiplier ?? 1),
  );

  // ---------------------------------
  // EFFECTS
  // ---------------------------------

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

  // When workout completes naturally, finish it.
  useEffect(() => {
    if (phase !== "completed") return;

    handleFinishWorkout();
  }, [phase]);

  // for the menu
  useEffect(() => {
    if (
      phase === "rest-set" ||
      phase === "rest-exercise" ||
      phase === "completed"
    ) {
      setMenuVisible(false);
    }
  }, [phase]);

  // ---------------------------------
  // ENGINE SYNC
  // ---------------------------------

  function syncExercisesFromEngine() {
    if (!engine) return;

    const current = engine.getCurrentExercise();
    const next = engine.getNextExercise();

    const progressionHistory = isVerification
      ? workoutHistory.filter(
          (workout) =>
            workout.trainingMode !== "verification" &&
            !workout.trainingMode?.startsWith("deload-"),
        )
      : workoutHistory;

    const currentWithProgression = current
      ? getNextExerciseConfig(current, progressionHistory)
      : null;

    const nextWithProgression = next
      ? getNextExerciseConfig(next, progressionHistory)
      : null;

    setCurrentExercise(
      currentWithProgression
        ? applyDeloadExercisePrescription(currentWithProgression, deloadContext)
        : null,
    );

    setNextExercise(
      nextWithProgression
        ? applyDeloadExercisePrescription(nextWithProgression, deloadContext)
        : null,
    );
  }

  const workoutDay = currentBlock;

  const prescribedWorkoutDay = React.useMemo(() => {
    if (!workoutDay?.exercises || !deloadContext) {
      return workoutDay;
    }

    if (isPainRecovery) {
      return {
        ...workoutDay,
        exercises: [],
      };
    }

    if (isReducedDeload) {
      return {
        ...workoutDay,
        exercises: workoutDay.exercises.map((exercise: ProgramExercise) => ({
          ...exercise,
          sets: Math.max(1, exercise.sets - 1),
        })),
      };
    }

    return workoutDay;
  }, [workoutDay, deloadContext, isPainRecovery, isReducedDeload]);

  const stats = React.useMemo(() => {
    if (!workoutDay?.exercises) {
      return { effectiveness: 0, difficulty: 0 };
    }

    return calculateWorkoutStats(workoutDay.exercises);
  }, [workoutDay]);

  const estimatedMinutes = React.useMemo(() => {
    return estimateWorkoutDuration(
      prescribedWorkoutDay,
      restBetweenSetsSeconds,
      restBetweenExercisesSeconds,
    );
  }, [prescribedWorkoutDay, restBetweenSetsSeconds, restBetweenExercisesSeconds]);

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

  // ---------------------------------
  // SAFETY RETURNS
  // ---------------------------------

  if (!program || !program.days || !program.days[dayIndex]) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading workout...</Text>
      </View>
    );
  }

  // ---------------------------------
  // NON-MAIN BLOCK
  // ---------------------------------

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
                startWorkoutTime,
              },
            })
          }
        />
      </View>
    );
  }

  // ---------------------------------
  // HELPERS
  // ---------------------------------

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

  // ---------------------------------
  // COMPLETE SETS
  // ---------------------------------

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

  // ---------------------------------
  // REST
  // ---------------------------------

  const handleRestStart = async (
    duration: number,
    type: "rest-set" | "rest-exercise",
  ) => {
    if (config.playRestSound) {
      const isHold = currentExercise?.type === "hold";

      if (isHold) {
        await soundManager.playStop(true);
      }

      await soundManager.playRestBeforeX(type);
    }

    startRestTimer(
      duration,
      (next) => {
        if (next === config.getReadyCountdownSeconds) {
          if (config.playRestSound) soundManager.playGetReady();

          if (config.enableVibration) {
            Vibration.vibrate(150);
          }
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

        if (config.enableVibration) {
          Vibration.vibrate(150);
        }

        if (type === "rest-exercise") {
          handleNextExercise();
        }
      },
    );
  };

  // ---------------------------------
  // SET / EXERCISE COMPLETION
  // ---------------------------------

  const checkSetCompletion = (
    updatedSets: WorkoutSet[],
    lastStatus: ItemStatus,
  ) => {
    if (!currentExercise) return;
    if (!engine) return;

    const isLastSet = updatedSets.length >= currentExercise.sets;
    const isLastExercise = !engine.hasNextExercise();

    // More sets remain
    if (!isLastSet) {
      if (lastStatus === ItemStatus.Skipped) {
        setPhase("active");
        return;
      }

      setPhase("rest-set");

      handleRestStart(restBetweenSetsSeconds, "rest-set");

      return;
    }

    // ---------------------------------
    // EXERCISE COMPLETE
    // ---------------------------------

    if (isLastExercise) {
      setCurrentExercise(null);
      setNextExercise(null);
      setPhase("completed");

      return;
    }

    setPhase("rest-exercise");

    handleRestStart(restBetweenExercisesSeconds, "rest-exercise");
  };

  const handleNextExercise = () => {
    if (!engine || !engine.hasNextExercise()) return;

    engine.nextExercise();

    syncExercisesFromEngine();

    setSets([]);
    setPhase("active");
  };

  // ---------------------------------
  // FINISH WORKOUT
  // ---------------------------------

  const handleFinishWorkout = () => {
    if (!engine) return;

    const completedWorkout = engine.finishWorkout();

    if (!completedWorkout) return;

    const updatedBlocks = [...session.blocks];

    const currentBlock = updatedBlocks[blockIndex];

    if (currentBlock) {
      updatedBlocks[blockIndex] = {
        ...currentBlock,
        status: "completed",
        completedAt: Date.now(),
      };
    }

    const updatedSession = {
      ...session,

      blocks: updatedBlocks,

      results: {
        ...session.results,

        workout: {
          ...completedWorkout,
          sectionSkipped,
        },
      },
    };

    router.replace({
      pathname: "/screens/workoutRunner",
      params: {
        session: JSON.stringify(updatedSession),
        blockIndex: String(Number(params.blockIndex) + 1),
        startWorkoutTime,
      },
    });
  };

  // ---------------------------------
  // SKIP SET
  // ---------------------------------

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

  // ---------------------------------
  // SKIP EXERCISE
  // ---------------------------------

  const handleSkipExercise = () => {
    if (!currentExercise) return;
    if (!engine) return;

    const remainingSets = currentExercise.sets - sets.length;

    if (remainingSets <= 0) return;

    const updatedSets = [
      ...sets,
      ...Array.from(
        { length: remainingSets },
        () => ({ skipped: true }) as WorkoutSet,
      ),
    ];

    setSets(updatedSets);

    // Record remaining sets as skipped.
    for (let i = 0; i < remainingSets; i++) {
      engine.completeSet({
        setNumber: sets.length + i + 1,
        status: ItemStatus.Skipped,
      });
    }

    const hasCompletedSet = sets.some((set) => !("skipped" in set));

    const isLastExercise = !engine.hasNextExercise();

    // Last exercise.
    if (isLastExercise) {
      setCurrentExercise(null);
      setNextExercise(null);
      setPhase("completed");

      return;
    }

    // Entire exercise skipped.
    if (!hasCompletedSet) {
      handleNextExercise();
      return;
    }

    // Some sets were completed.
    setPhase("rest-exercise");

    handleRestStart(restBetweenExercisesSeconds, "rest-exercise");
  };

  // ---------------------------------
  // SKIP SECTION
  // ---------------------------------
  const handleSkipSection = () => {
    if (!engine) return;

    setMenuVisible(false);

    /*
     * The user may already have completed some sets.
     *
     * We must:
     * 1. Mark remaining sets in the current exercise as skipped.
     * 2. Mark all sets in remaining exercises as skipped.
     * 3. Finish the workout engine.
     * 4. Explicitly complete the current MAIN block.
     * 5. Store the completed workout result.
     * 6. Continue to the next section.
     */

    // ---------------------------------
    // 1. Finish remaining sets in the
    //    current exercise
    // ---------------------------------

    if (currentExercise) {
      const remainingSets = currentExercise.sets - sets.length;

      for (let i = 0; i < remainingSets; i++) {
        engine.completeSet({
          setNumber: sets.length + i + 1,
          status: ItemStatus.Skipped,
        });
      }
    }

    // ---------------------------------
    // 2. Skip every remaining exercise
    // ---------------------------------

    while (engine.hasNextExercise()) {
      engine.nextExercise();

      const exercise = engine.getCurrentExercise();

      if (!exercise) break;

      const progressionHistory = isVerification
        ? workoutHistory.filter(
            (workout) =>
              workout.trainingMode !== "verification" &&
              !workout.trainingMode?.startsWith("deload-"),
          )
        : workoutHistory;

      const exerciseWithProgression = getNextExerciseConfig(
        exercise,
        progressionHistory,
      );

      const prescribedExercise = applyDeloadExercisePrescription(
        exerciseWithProgression,
        deloadContext,
      );

      if (!prescribedExercise) {
        continue;
      }

      for (
        let setNumber = 1;
        setNumber <= prescribedExercise.sets;
        setNumber++
      ) {
        engine.completeSet({
          setNumber,
          status: ItemStatus.Skipped,
        });
      }
    }

    // ---------------------------------
    // 3. Mark section as skipped
    // ---------------------------------

    setSectionSkipped(true);

    // ---------------------------------
    // 4. Finish the engine
    // ---------------------------------

    const completedWorkout = engine.finishWorkout();

    if (!completedWorkout) return;

    // ---------------------------------
    // 5. Explicitly complete the MAIN
    //    workout block
    // ---------------------------------

    const updatedBlocks = [...session.blocks];

    const currentBlock = updatedBlocks[blockIndex];

    if (currentBlock) {
      updatedBlocks[blockIndex] = {
        ...currentBlock,
        status: "completed",
        completedAt: Date.now(),
      };
    }

    // ---------------------------------
    // 6. Update session
    // ---------------------------------

    const updatedSession = {
      ...session,

      blocks: updatedBlocks,

      results: {
        ...session.results,

        workout: {
          ...completedWorkout,
          sectionSkipped: true,
        },
      },
    };

    // ---------------------------------
    // 7. Keep local workout history
    //    in sync
    // ---------------------------------

    // ---------------------------------
    // 8. Move to next section
    // ---------------------------------

    const nextBlockIndex = blockIndex + 1;

    // No more sections -> Summary
    if (nextBlockIndex >= session.blocks.length) {
      router.replace({
        pathname: "/screens/workoutSummary",
        params: {
          session: JSON.stringify(updatedSession),
          startWorkoutTime,
        },
      });

      return;
    }

    // Continue with next section
    router.replace({
      pathname: "/screens/workoutRunner",
      params: {
        session: JSON.stringify(updatedSession),
        blockIndex: String(nextBlockIndex),
        startWorkoutTime,
      },
    });
  };

  // ---------------------------------
  // PAIN RECOVERY: OMIT STRENGTH WORK
  // ---------------------------------

  const recoveryDurationTotalMinutes =
    recoveryDurationHours * 60 + recoveryDurationMinutes;

  const parsedRecoveryDistance = Number(recoveryDistance);
  const hasRecoveryDistance =
    recoveryDistance.trim().length > 0 &&
    Number.isFinite(parsedRecoveryDistance) &&
    parsedRecoveryDistance > 0;

  const hasRecoveryDuration =
    recoveryDurationTotalMinutes > 0 &&
    (recoveryActivityType === "walking" ||
      recoveryActivityType === "easy-cycling" ||
      recoveryDurationTouched);
  const hasRecoveryNotes = recoveryNotes.trim().length > 0;

  const isRecoveryFormValid = (() => {
    if (recoveryActivityType === "guided-mobility") {
      return guidedIncludeWarmup || guidedIncludeStretch;
    }

    if (
      recoveryActivityType === "walking" ||
      recoveryActivityType === "easy-cycling"
    ) {
      return hasRecoveryDuration || hasRecoveryDistance;
    }

    if (recoveryActivityType === "other") {
      return hasRecoveryNotes;
    }

    // Gentle mobility: duration and distance are optional.
    return true;
  })();

  const handleCompletePainRecoveryMain = () => {
    if (!engine || !isRecoveryFormValid) return;

    const isGuidedRecovery = recoveryActivityType === "guided-mobility";

    if (isGuidedRecovery) {
      router.push({
        pathname: "/screens/preWorkoutOverView",
        params: {
          dayIndex: String(dayIndex),
          includeWarmup: String(guidedIncludeWarmup),
          includeStretch: String(guidedIncludeStretch),
          recoveryGuided: "true",
        },
      });
      return;
    }

    const recoveryActivity: RecoveryActivity = {
      type: recoveryActivityType,
      durationMinutes:
        isGuidedRecovery || !hasRecoveryDuration
          ? undefined
          : recoveryDurationTotalMinutes,
      distance: hasRecoveryDistance ? parsedRecoveryDistance : undefined,
      distanceUnit: hasRecoveryDistance ? recoveryDistanceUnit : undefined,
      notes: recoveryNotes.trim() || undefined,
      completed: true,
    };

    const completedWorkout = engine.finishWorkout();

    if (!completedWorkout) return;

    const updatedBlocks = [...session.blocks];
    const currentMainBlock = updatedBlocks[blockIndex];

    if (currentMainBlock) {
      updatedBlocks[blockIndex] = {
        ...currentMainBlock,
        status: "completed",
        completedAt: Date.now(),
      };
    }

    const updatedSession = {
      ...session,
      blocks: updatedBlocks,
      results: {
        ...session.results,
        workout: {
          ...completedWorkout,
          sectionSkipped: true,
          recoveryActivity,
        },
      },
    };

    const nextBlockIndex = blockIndex + 1;

    if (nextBlockIndex >= session.blocks.length) {
      router.replace({
        pathname: "/screens/workoutSummary",
        params: {
          session: JSON.stringify(updatedSession),
          startWorkoutTime,
        },
      });
      return;
    }

    router.replace({
      pathname: "/screens/workoutRunner",
      params: {
        session: JSON.stringify(updatedSession),
        blockIndex: String(nextBlockIndex),
        startWorkoutTime,
      },
    });
  };

  // ---------------------------------
  // ABORT WORKOUT
  // ---------------------------------

  const handleAbortWorkout = () => {
    setMenuVisible(false);

    Alert.alert(
      "Abort Workout?",
      "Your current workout progress will be lost.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Abort Workout",
          style: "destructive",
          onPress: () => {
            // Do NOT call engine.finishWorkout().
            // An aborted workout is not a completed workout.

            setCurrentExercise(null);
            setNextExercise(null);
            setSets([]);
            setPhase("active");

            router.replace("/");
          },
        },
      ],
    );
  };

  // ---------------------------------
  // UI
  // ---------------------------------

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Persistent header */}

        {!isPainRecovery && (
          <>
            <TopAppBar
              effectiveness={stats.effectiveness}
              difficulty={stats.difficulty}
              onMenuPress={() => setMenuVisible(true)}
            />

            <WorkoutProgress blocks={session.blocks} />
          </>
        )}

        {deloadContext && (
          <View
            style={{
              width: "92%",
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 8,
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isVerification ? "#7CB342" : "#4FC3F7",
              backgroundColor: isVerification ? "#1B2A16" : "#10242D",
            }}
          >
            <Text
              style={{
                color: isVerification ? "#C5E1A5" : "#B3E5FC",
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {isVerification
                ? "Verification Week • 80% Recovery Target"
                : isPainRecovery
                  ? "Pain Recovery Cycle • Strength Work Paused"
                  : "Deload Week • 60% Recovery Targets"}
            </Text>

            <Text
              style={{
                color: "#ddd",
                fontSize: 13,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              {isVerification
                ? "Normal exercise structure is restored. Targets are temporarily reduced to verify recovery before full progression resumes."
                : isPainRecovery
                  ? "Complete only comfortable recovery work. The normal strength block is intentionally omitted today."
                  : `One fewer set per exercise, recovery targets at 60% of the healthy MB baseline, and ${deloadContext.restMultiplier}× rest. Match-or-Beat progression is paused.`}
            </Text>
          </View>
        )}

        {/* Screen content */}

        {!started ? (
          <ScrollView style={{ width: "100%" }}>
            <Text style={styles.title}>
              {isVerification
                ? "Verification Workout"
                : isPainRecovery
                  ? "Recovery Session"
                  : isReducedDeload
                    ? "Deload Workout"
                    : "Workout"}
            </Text>

            <View style={styles.exerciseList}>
              {!isPainRecovery && (
                <Text
                  style={{
                    color: "#FFD700",
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  Tap an exercise for instructions →
                </Text>
              )}

              {isPainRecovery ? (
                <View style={styles.exerciseCard}>
                  <Text style={styles.exerciseName}>
                    🛡️ Day {dayIndex + 1} Recovery
                  </Text>
                  <Text style={styles.exerciseType}>
                    Choose a comfortable recovery activity. Normal strength work is paused.
                  </Text>
                </View>
              ) : (
                workoutDay.exercises.map((ex: ProgramExercise) => {
                  const hydrated = engine?.hydrateExercise(ex);

                  if (!hydrated) return null;

                  const previewExercise = applyDeloadExercisePrescription(
                    hydrated,
                    deloadContext,
                  );

                  if (!previewExercise) return null;

                  return (
                    <TouchableOpacity
                      key={previewExercise.id}
                      style={styles.exerciseCard}
                      activeOpacity={0.6}
                      onPress={() =>
                        router.push({
                          pathname: "/screens/exerciseGuideScreen",
                          params: {
                            exerciseId: previewExercise.id,
                          },
                        })
                      }
                    >
                      <Text style={styles.exerciseName}>
                        {getExerciseIcon(previewExercise.type)} {previewExercise.name}
                      </Text>

                      <View style={styles.exerciseMeta}>
                        <Text style={styles.exerciseType}>
                          {previewExercise.type} • {previewExercise.sets} sets
                        </Text>

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
                })
              )}
            </View>

            {!isPainRecovery && (
              <Text style={styles.estimateText}>
                Estimated Workout Time: ~{estimatedMinutes} min
              </Text>
            )}

            <PrimaryButton
              title={isPainRecovery ? "Start Recovery Session" : isReducedDeload ? "Start Deload Workout" : isVerification ? "Start Verification Workout" : "Start Workout"}
              onPress={() => {
                if (!engine) return;

                engine.startWorkout();

                setStarted(true);
                setPhase("active");
                setSectionSkipped(false);

                syncExercisesFromEngine();
              }}
            />
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{
              alignItems: "center",
            }}
          >
            {isPainRecovery ? (
              <View
                style={{
                  width: "92%",
                  padding: 18,
                  borderRadius: 12,
                  backgroundColor: "#10242D",
                  marginTop: 18,
                }}
              >
                <Text
                  style={{
                    color: "#B3E5FC",
                    fontSize: 22,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  🛡️ Day {dayIndex + 1} Recovery
                </Text>

                <Text
                  style={{
                    color: "#ddd",
                    fontSize: 15,
                    lineHeight: 22,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  This main strength block is intentionally omitted during the pain recovery cycle. Choose comfortable recovery work only. Stop any movement that reproduces joint discomfort.
                </Text>

                <Text
                  style={{
                    color: "#B3E5FC",
                    fontWeight: "700",
                    marginTop: 20,
                    marginBottom: 8,
                  }}
                >
                  Recovery choice
                </Text>

                {[
                  ["guided-mobility", "Guided mobility / stretch"],
                  ["walking", "Light walk"],
                  ["easy-cycling", "Easy cycling"],
                  ["mobility", "Gentle mobility"],
                  ["other", "Other light recovery"],
                ].map(([value, label]) => {
                  const selected = recoveryActivityType === value;

                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setRecoveryActivityType(value as RecoveryActivityType)
                      }
                      style={{
                        borderWidth: 1,
                        borderColor: selected ? "#4FC3F7" : "#555",
                        backgroundColor: selected ? "#173846" : "#1c1c1c",
                        borderRadius: 10,
                        paddingVertical: 11,
                        paddingHorizontal: 12,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: selected ? "700" : "500" }}>
                        {selected ? "✓ " : ""}{label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {recoveryActivityType === "guided-mobility" && (
                  <View
                    style={{
                      marginTop: 8,
                      marginBottom: 14,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#3A6575",
                      backgroundColor: "#132B35",
                    }}
                  >
                    <Text
                      style={{
                        color: "#B3E5FC",
                        fontWeight: "700",
                        marginBottom: 10,
                      }}
                    >
                      Select guided recovery
                    </Text>

                    {[
                      {
                        key: "warmup",
                        label: "Dynamic Warm-ups",
                        selected: guidedIncludeWarmup,
                        onPress: () =>
                          setGuidedIncludeWarmup((value) => !value),
                      },
                      {
                        key: "stretch",
                        label: "Static Stretches",
                        selected: guidedIncludeStretch,
                        onPress: () =>
                          setGuidedIncludeStretch((value) => !value),
                      },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        onPress={option.onPress}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: option.selected ? "#4FC3F7" : "#555",
                          backgroundColor: option.selected
                            ? "#173846"
                            : "#1c1c1c",
                          borderRadius: 10,
                          paddingVertical: 11,
                          paddingHorizontal: 12,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 16,
                            fontWeight: option.selected ? "700" : "500",
                          }}
                        >
                          {option.selected ? "☑" : "☐"} {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {!guidedIncludeWarmup && !guidedIncludeStretch && (
                      <Text
                        style={{
                          color: "#FFB74D",
                          fontSize: 13,
                          lineHeight: 18,
                          marginTop: 2,
                        }}
                      >
                        Select Dynamic Warm-ups, Static Stretches, or both.
                      </Text>
                    )}
                  </View>
                )}

                {recoveryActivityType !== "guided-mobility" && (
                  <>
                    <Text style={styles.recoveryFieldLabel}>
                      Duration — optional
                    </Text>

                    <View style={styles.recoveryDurationRow}>
                      <View style={styles.recoveryDurationColumn}>
                        <TouchableOpacity
                          onPress={() => {
                            setRecoveryDurationTouched(true);
                            setRecoveryDurationHours((value) =>
                              Math.min(value + 1, 12),
                            );
                          }}
                          style={styles.recoveryStepperButton}
                        >
                          <Text style={styles.recoveryStepperButtonText}>＋</Text>
                        </TouchableOpacity>

                        <Text style={styles.recoveryDurationValue}>
                          {recoveryDurationHours}
                        </Text>
                        <Text style={styles.recoveryDurationUnit}>hours</Text>

                        <TouchableOpacity
                          onPress={() => {
                            setRecoveryDurationTouched(true);
                            setRecoveryDurationHours((value) =>
                              Math.max(value - 1, 0),
                            );
                          }}
                          style={styles.recoveryStepperButton}
                        >
                          <Text style={styles.recoveryStepperButtonText}>−</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.recoveryDurationColumn}>
                        <TouchableOpacity
                          onPress={() => {
                            setRecoveryDurationTouched(true);
                            setRecoveryDurationMinutes((value) =>
                              Math.min(value + 5, 55),
                            );
                          }}
                          style={styles.recoveryStepperButton}
                        >
                          <Text style={styles.recoveryStepperButtonText}>＋</Text>
                        </TouchableOpacity>

                        <Text style={styles.recoveryDurationValue}>
                          {String(recoveryDurationMinutes).padStart(2, "0")}
                        </Text>
                        <Text style={styles.recoveryDurationUnit}>minutes</Text>

                        <TouchableOpacity
                          onPress={() => {
                            setRecoveryDurationTouched(true);
                            setRecoveryDurationMinutes((value) =>
                              Math.max(value - 5, 0),
                            );
                          }}
                          style={styles.recoveryStepperButton}
                        >
                          <Text style={styles.recoveryStepperButtonText}>−</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.recoveryFieldLabel}>
                      Distance — optional
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                      <TextInput
                        value={recoveryDistance}
                        onChangeText={setRecoveryDistance}
                        keyboardType="decimal-pad"
                        placeholder="e.g. 2.5"
                        placeholderTextColor="#777"
                        style={{
                          flex: 1,
                          color: "#fff",
                          borderWidth: 1,
                          borderColor: "#555",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                        }}
                      />

                      {(["km", "mi"] as const).map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          onPress={() => setRecoveryDistanceUnit(unit)}
                          style={{
                            minWidth: 48,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor:
                              recoveryDistanceUnit === unit ? "#4FC3F7" : "#555",
                            backgroundColor:
                              recoveryDistanceUnit === unit ? "#173846" : "#1c1c1c",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.recoveryHelperText}>
                      {recoveryActivityType === "walking" ||
                      recoveryActivityType === "easy-cycling"
                        ? "Duration or distance is required. You can record both."
                        : recoveryActivityType === "other"
                          ? "Duration and distance are optional. Describe the recovery activity below."
                          : "Duration and distance are optional."}
                    </Text>

                    {recoveryActivityType === "other" && (
                      <TextInput
                        value={recoveryNotes}
                        onChangeText={setRecoveryNotes}
                        placeholder="What recovery activity did you do?"
                        placeholderTextColor="#777"
                        style={{
                          color: "#fff",
                          borderWidth: 1,
                          borderColor: "#555",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          marginBottom: 10,
                        }}
                      />
                    )}
                  </>
                )}

                <PrimaryButton
                  title={
                    recoveryActivityType === "guided-mobility"
                      ? "Complete Guided Recovery"
                      : "Save Active Recovery"
                  }
                  onPress={handleCompletePainRecoveryMain}
                  disabled={!isRecoveryFormValid}
                />
              </View>
            ) : currentExercise && (
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

                {isReducedDeload && currentExercise.matchOrBeatTargets?.some((target) => target.target != null) && (
                  <Text
                    style={{
                      color: "#81D4FA",
                      marginTop: 8,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Recovery target • MB progression paused
                  </Text>
                )}

                {isVerification && (
                  <Text
                    style={{
                      color: "#AED581",
                      marginTop: 8,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Verification target • 80% of healthy pre-deload MB
                  </Text>
                )}
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
                          transform: [
                            {
                              scale: pulseAnim,
                            },
                          ],
                        },
                      ]}
                    >
                      {restTimeLeft}s
                    </Animated.Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        color: "#aaa",
                        fontSize: 16,
                      }}
                    >
                      Up Next
                    </Text>

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

                        <Text
                          style={{
                            color: "#ccc",
                            marginTop: 5,
                          }}
                        >
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
                          transform: [
                            {
                              scale: pulseAnim,
                            },
                          ],
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

            {/* TEMPO */}

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

            {/* HOLD */}

            {currentExercise?.type === "hold" && phase === "active" && (
              <HoldExercise
                exerciseName={currentExercise.name}
                totalSets={currentExercise.sets}
                duration={
                  currentExercise.matchOrBeatTargets?.find(
                    (target) => target.setNumber === sets.length + 1,
                  )?.target ?? (currentExercise.config as any).durationSeconds
                }
                sets={sets as any}
                sideMode={currentExercise.sideMode}
                onSetComplete={completeHoldSet}
                matchOrBeatTargets={currentExercise.matchOrBeatTargets}
              />
            )}

            {/* REPS */}

            {currentExercise?.type === "reps" && phase === "active" && (
              <RepsExercise
                exerciseName={currentExercise.name}
                totalSets={currentExercise.sets}
                sets={sets.filter(
                  (
                    s,
                  ): s is {
                    reps: any;
                  } => "reps" in s,
                )}
                minReps={minReps}
                maxReps={maxReps}
                sideMode={currentExercise.sideMode}
                onCompleteSet={completeRepsSet}
                matchOrBeatTargets={currentExercise.matchOrBeatTargets}
              />
            )}
          </ScrollView>
        )}

        {!isPainRecovery && (
        <WorkoutMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onSkipSet={handleSkipSet}
          onSkipExercise={handleSkipExercise}
          onSkipSection={handleSkipSection}
          onAbortWorkout={handleAbortWorkout}
          showSkipSet={phase === "active"}
          showSkipExercise={phase === "active"}
          showSkipSection={phase === "active"}
        />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

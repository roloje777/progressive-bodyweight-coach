import { useTranslation } from "@/hooks/useTranslation";
// app/screens/Workout.tsx
import { useLocalSearchParams, router } from "expo-router";
import { useProgress } from "@/hooks/useProgress";
import { useAdaptiveRestSettings } from "@/hooks/useAdaptiveRestSettings";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WorkoutMenu from "@/components/WorkoutMenu";
import { useAppStyles } from "../../styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
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
  ExerciseEffortRating,
  RecoveryActivity,
  RecoveryActivityType,
} from "@/models/WorkoutLog";
import { ItemStatus } from "@/models/WorkoutStatus";
import WorkoutProgress from "@/components/WorkoutProgress";
import { useActiveWorkoutCheckpoint } from "@/hooks/useActiveWorkoutCheckpoint";
import { usePreventWorkoutBackNavigation } from "@/hooks/usePreventWorkoutBackNavigation";
import { clearActiveWorkout } from "@/storage/activeWorkoutStorage";
import { RecoveryTimerState } from "@/models/WorkoutRecovery";
import { logRecoveryEvent } from "@/utils/recoveryDiagnostics";
import {
  AdaptiveRestDecision,
  getAdaptiveExerciseRestDecision,
  getAdaptiveSetRestDecision,
} from "@/engine/AdaptiveRestEngine";

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
  const safeAreaInsets = useSafeAreaInsets();
  const styles = useAppStyles();
  const palette = useAppPalette();
  const { t, exerciseName, workoutTitle, exerciseType } = useTranslation();
  usePreventWorkoutBackNavigation();
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

  const { adaptiveRestConfig } = useAdaptiveRestSettings();

  const [session, setSession] = useState(() =>
    JSON.parse(params.session as string),
  );

  const blockIndex = Number(params.blockIndex ?? 0);
  const recoveryState = React.useMemo(() => {
    try { return params.recoveryState ? JSON.parse(params.recoveryState as string) : {}; } catch { return {}; }
  }, [params.recoveryState]);
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

  const [started, setStarted] = useState(recoveryState.started === true);

  const [phase, setPhase] = useState<
    "active" | "rate-exercise" | "rest-set" | "rest-exercise" | "completed"
  >(recoveryState.phase ?? "active");

  const { restTimeLeft, startRestTimer, stopRestTimer } = useWorkoutTimer();

  const [recoveryTimerState, setRecoveryTimerState] =
    useState<RecoveryTimerState | null>(
      recoveryState.timerState ?? null,
    );

  const [currentExercise, setCurrentExercise] =
    useState<HydratedExercise | null>(null);

  const [nextExercise, setNextExercise] = useState<HydratedExercise | null>(
    null,
  );

  const [sets, setSets] = useState<WorkoutSet[]>(recoveryState.sets ?? []);

  const [restBeforeCurrentSet, setRestBeforeCurrentSet] = useState<{
    prescribedRestBeforeSet: number;
    actualRestBeforeSet: number;
    adaptiveRestAdjustmentBeforeSet: number;
  } | null>(null);

  const [currentRestDecision, setCurrentRestDecision] =
    useState<AdaptiveRestDecision | null>(null);

  // NEW:
  // Tracks whether the whole main workout section was skipped.
  const [sectionSkipped, setSectionSkipped] = useState(recoveryState.sectionSkipped === true);

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
    adaptiveRestConfig.defaultSetRestSeconds *
      (deloadContext?.restMultiplier ?? 1),
  );

  const restBetweenExercisesSeconds = Math.ceil(
    adaptiveRestConfig.defaultExerciseRestSeconds *
      (deloadContext?.restMultiplier ?? 1),
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

    if (recoveryState.engineState) {
      engine.restoreState(recoveryState.engineState);

      const restoredTimer = recoveryState.timerState as
        | RecoveryTimerState
        | null
        | undefined;

      if (
        (recoveryState.phase === "rest-set" ||
          recoveryState.phase === "rest-exercise") &&
        restoredTimer &&
        (restoredTimer.kind === "rest-set" ||
          restoredTimer.kind === "rest-exercise")
      ) {
        const elapsedSeconds = Math.max(
          0,
          Math.floor((Date.now() - restoredTimer.startedAt) / 1000),
        );
        const remainingSeconds = Math.max(
          0,
          restoredTimer.durationSeconds - elapsedSeconds,
        );

        void logRecoveryEvent("rest_reconstructed", {
          kind: restoredTimer.kind,
          durationSeconds: restoredTimer.durationSeconds,
          elapsedSeconds,
          remainingSeconds,
          exerciseId: restoredTimer.exerciseId,
          setNumber: restoredTimer.setNumber,
        });

        const restTypeEnabled =
          restoredTimer.kind === "rest-set"
            ? adaptiveRestConfig.restBetweenSetsEnabled
            : adaptiveRestConfig.restBetweenExercisesEnabled;

        if (!restTypeEnabled) {
          setRecoveryTimerState(null);

          if (
            restoredTimer.kind === "rest-exercise" &&
            engine.hasNextExercise()
          ) {
            engine.nextExercise();
            setSets([]);
          }

          setPhase("active");
        } else if (remainingSeconds <= 0) {
          setRecoveryTimerState(null);

          if (
            restoredTimer.kind === "rest-exercise" &&
            engine.hasNextExercise()
          ) {
            engine.nextExercise();
            setSets([]);
          }

          setPhase("active");
        } else {
          const restoredRestKind: "rest-set" | "rest-exercise" =
            restoredTimer.kind;

          setRecoveryTimerState(restoredTimer);
          setPhase(restoredRestKind);

          // Reconstruct from the original wall-clock start so rest continues
          // naturally across backgrounding/process restart.
          setTimeout(() => {
            handleRestStart(
              restoredTimer.durationSeconds,
              restoredRestKind,
              undefined,
              restoredTimer,
              true,
            );
          }, 0);
        }
      } else if (
        recoveryState.phase === "rest-exercise" &&
        engine.hasNextExercise()
      ) {
        // Backward-compatible fallback for V1 snapshots without timer metadata.
        engine.nextExercise();
        setSets([]);
        setPhase("active");
      } else if (recoveryState.phase === "rest-set") {
        setPhase("active");
      }
    }

    syncExercisesFromEngine();
  }, [engine]);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getWorkoutHistory();
      setWorkoutHistory(history);

      // Recovery can restore the current exercise before React has applied the
      // newly loaded workoutHistory state. Re-sync immediately with the fresh
      // history so Match-or-Beat targets are rebuilt for the resumed exercise.
      syncExercisesFromEngine(history);
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
      phase === "rate-exercise" ||
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

  function syncExercisesFromEngine(
    historyOverride?: CompletedSession[],
  ) {
    if (!engine) return;

    const current = engine.getCurrentExercise();
    const next = engine.getNextExercise();
    const history = historyOverride ?? workoutHistory;

    const progressionHistory = isVerification
      ? history.filter(
          (workout) =>
            workout.trainingMode !== "verification" &&
            !workout.trainingMode?.startsWith("deload-"),
        )
      : history;

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

  // Show the session average before training; show the individual exercise
  // during training (including its set-rest and rating states).
  const topBarStats = React.useMemo(() => {
    if (!started || !currentExercise || phase === "completed") return stats;
    const exerciseId = currentExercise.exerciseId ?? currentExercise.id;
    return calculateWorkoutStats([{ ...currentExercise, id: exerciseId }]);
  }, [started, currentExercise, phase, stats]);

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


  useActiveWorkoutCheckpoint({
    screen: "workout",
    blockIndex,
    session,
    activeBlockId: session.blocks?.[blockIndex]?.id,
    screenState: {
      started,
      phase,
      sets,
      sectionSkipped,
      timerState: recoveryTimerState,
      engineState: engine?.exportState(),
    },
  });

  // ---------------------------------
  // SAFETY RETURNS
  // ---------------------------------

  if (!program || !program.days || !program.days[dayIndex]) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t("workout.loading")}</Text>
      </View>
    );
  }

  // ---------------------------------
  // NON-MAIN BLOCK
  // ---------------------------------

  if (currentBlock.type !== "main") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{workoutTitle(currentBlock.title)}</Text>

        <ScrollView>
          {currentBlock.exercises.map((ex: any) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exerciseName(ex.exerciseId ?? ex.id, ex.name)}</Text>
            </View>
          ))}
        </ScrollView>

        <PrimaryButton
          title={t("workout.continue")}
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
        ...(restBeforeCurrentSet ?? {}),
      });
    }

    checkSetCompletion(updatedSets, ItemStatus.Completed);
  };

  // ---------------------------------
  // REST
  // ---------------------------------

  const playRestTransitionCue = async (
    type: "rest-set" | "rest-exercise",
  ) => {
    if (!config.playRestSound) return;

    const isHold = currentExercise?.type === "hold";

    if (isHold) {
      await soundManager.playStop(true);
    }

    await soundManager.playRestBeforeX(type);
  };

  const handleRestStart = async (
    duration: number,
    type: "rest-set" | "rest-exercise",
    decision?: AdaptiveRestDecision,
    restoredTimer?: RecoveryTimerState,
    isRecovery = false,
  ) => {
    setCurrentRestDecision(decision ?? null);
    setRestBeforeCurrentSet({
      prescribedRestBeforeSet: duration,
      actualRestBeforeSet: duration,
      adaptiveRestAdjustmentBeforeSet:
        decision?.adaptiveAdjustmentSeconds ?? 0,
    });
    const timerState: RecoveryTimerState =
      restoredTimer ?? {
        kind: type,
        startedAt: Date.now(),
        durationSeconds: duration,
        exerciseId: currentExercise?.exerciseId,
        setNumber: sets.length + (type === "rest-set" ? 1 : 0),
      };

    setRecoveryTimerState(timerState);
    if (!isRecovery) {
      await playRestTransitionCue(type);
    }

    startRestTimer(
      timerState.durationSeconds,
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
        setRecoveryTimerState(null);
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
      { startedAt: timerState.startedAt },
    );
  };

  const handleSkipRest = () => {
    if (phase !== "rest-set" && phase !== "rest-exercise") return;

    const restKind = phase;
    const timerState = recoveryTimerState;
    const prescribedSeconds =
      timerState?.durationSeconds ??
      (restKind === "rest-set"
        ? restBetweenSetsSeconds
        : restBetweenExercisesSeconds);

    const elapsedSeconds = timerState
      ? Math.max(
          0,
          Math.min(
            prescribedSeconds,
            Math.floor((Date.now() - timerState.startedAt) / 1000),
          ),
        )
      : Math.max(0, prescribedSeconds - restTimeLeft);

    stopRestTimer();
    setRecoveryTimerState(null);

    if (restKind === "rest-set") {
      setRestBeforeCurrentSet((current) => ({
        prescribedRestBeforeSet:
          current?.prescribedRestBeforeSet ?? prescribedSeconds,
        actualRestBeforeSet: elapsedSeconds,
        adaptiveRestAdjustmentBeforeSet:
          current?.adaptiveRestAdjustmentBeforeSet ??
          currentRestDecision?.adaptiveAdjustmentSeconds ??
          0,
      }));
      setCurrentRestDecision(null);
      setPhase("active");
      return;
    }

    setCurrentRestDecision(null);
    handleNextExercise();
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

    // More sets remain.
    if (!isLastSet) {
      if (lastStatus === ItemStatus.Skipped) {
        setPhase("active");
        return;
      }

      const currentSet = updatedSets[updatedSets.length - 1];
      const previousSet = updatedSets[updatedSets.length - 2];

      const currentSetNumber = updatedSets.length;
      const matchOrBeatTarget = currentExercise.matchOrBeatTargets?.find(
        (target) => target.setNumber === currentSetNumber,
      )?.target;

      if (!adaptiveRestConfig.restBetweenSetsEnabled) {
        // The setting controls only the visual countdown. The normal
        // "rest before next set" audio guidance still plays.
        void playRestTransitionCue("rest-set");

        setCurrentRestDecision(null);
        setRestBeforeCurrentSet({
          prescribedRestBeforeSet: 0,
          actualRestBeforeSet: 0,
          adaptiveRestAdjustmentBeforeSet: 0,
        });
        setPhase("active");
        return;
      }

      const decision = getAdaptiveSetRestDecision({
        config: adaptiveRestConfig,
        baseRestSeconds: restBetweenSetsSeconds,
        previousSet: previousSet as Partial<CompletedSet> | undefined,
        currentSet: currentSet as Partial<CompletedSet>,
        workoutHistory,
        programId: program?.id,
        exerciseId: currentExercise.exerciseId,
        currentSetNumber,
        matchOrBeatTarget,
        currentRestBeforeSetSeconds:
          restBeforeCurrentSet?.actualRestBeforeSet ?? null,
      });

      setPhase("rest-set");
      handleRestStart(
        decision.recommendedRestSeconds,
        "rest-set",
        decision,
      );
      return;
    }

    // Exercise-effort ratings are progression feedback.
    //
    // A reduced-load deload is intentionally easy, so recording 1/2/3 here
    // would create misleading difficulty evidence. Pain recovery has no normal
    // strength exercises. Verification keeps the rating because it is the
    // controlled bridge back to normal progression.
    if (
      adaptiveRestConfig.exerciseEffortRatingEnabled &&
      !isReducedDeload &&
      !isPainRecovery
    ) {
      setPhase("rate-exercise");
      return;
    }

    completeExerciseTransition(null);
  };

  const completeExerciseTransition = (
    effortRating: ExerciseEffortRating | null,
  ) => {
    if (!engine) return;

    if (effortRating != null) {
      engine.setCurrentExerciseEffortRating(effortRating);
    }

    const isLastExercise = !engine.hasNextExercise();

    if (isLastExercise) {
      setCurrentExercise(null);
      setNextExercise(null);
      setPhase("completed");
      return;
    }

    if (!adaptiveRestConfig.restBetweenExercisesEnabled) {
      // The setting controls only the visual countdown. The normal
      // "rest before next exercise" audio guidance still plays.
      void playRestTransitionCue("rest-exercise");

      handleNextExercise();
      return;
    }

    const decision = getAdaptiveExerciseRestDecision({
      config: adaptiveRestConfig,
      baseRestSeconds: restBetweenExercisesSeconds,
      exerciseEffortRating: effortRating,
      workoutHistory,
      programId: program?.id,
      exerciseId: currentExercise?.exerciseId,
      completedSets: engine.getCurrentExerciseCompletedSets(),
      matchOrBeatTargets: currentExercise?.matchOrBeatTargets,
    });

    setPhase("rest-exercise");
    handleRestStart(
      decision.recommendedRestSeconds,
      "rest-exercise",
      decision,
    );
  };

  const handleNextExercise = () => {
    if (!engine || !engine.hasNextExercise()) return;

    engine.nextExercise();

    syncExercisesFromEngine();

    setSets([]);
    setCurrentRestDecision(null);
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
    const decision = getAdaptiveExerciseRestDecision({
      config: adaptiveRestConfig,
      baseRestSeconds: restBetweenExercisesSeconds,
      exerciseEffortRating: null,
      workoutHistory,
      programId: program?.id,
      exerciseId: currentExercise?.exerciseId,
      completedSets: engine.getCurrentExerciseCompletedSets(),
      matchOrBeatTargets: currentExercise?.matchOrBeatTargets,
    });

    setPhase("rest-exercise");

    handleRestStart(
      decision.recommendedRestSeconds,
      "rest-exercise",
      decision,
    );
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
  // EXERCISE GUIDE
  // ---------------------------------

  const handleOpenExerciseGuide = () => {
    const guideExercise =
      phase === "rest-exercise" && nextExercise
        ? nextExercise
        : currentExercise;

    if (!guideExercise) return;

    const exerciseId =
      (guideExercise as any).id ?? guideExercise.exerciseId;

    if (!exerciseId) return;

    const isResting = phase === "rest-set" || phase === "rest-exercise";

    router.push({
      pathname: "/screens/exerciseGuideScreen",
      params: {
        exerciseId: String(exerciseId),
        workoutGuide: "true",
        guideContext:
          phase === "rest-exercise" ? "up-next" : "current",
        ...(isResting && recoveryTimerState
          ? {
              restKind: recoveryTimerState.kind,
              restStartedAt: String(recoveryTimerState.startedAt),
              restDurationSeconds: String(recoveryTimerState.durationSeconds),
            }
          : {}),
      },
    });
  };

  // ---------------------------------
  // ABORT WORKOUT
  // ---------------------------------

  const handleAbortWorkout = () => {
    setMenuVisible(false);

    Alert.alert(
      t("workout.abortTitle"),
      t("workout.abortBody"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("workout.menu.abort"),
          style: "destructive",
          onPress: () => {
            // Do NOT call engine.finishWorkout().
            // An aborted workout is not a completed workout.

            setCurrentExercise(null);
            setNextExercise(null);
            setSets([]);
            setPhase("active");

            clearActiveWorkout().finally(() => router.replace("/"));
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
      <View style={[styles.container, { paddingBottom: Math.max(20, safeAreaInsets.bottom) }]}>
        {/* Persistent header */}

        {!isPainRecovery && (
          <>
            <TopAppBar
              effectiveness={topBarStats.effectiveness}
              difficulty={topBarStats.difficulty}
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
              borderColor: isVerification ? "#7CB342" : palette.info,
              backgroundColor: palette.surface,
            }}
          >
            <Text
              style={{
                color: isVerification ? palette.accent : palette.info,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {isVerification
                ? t("workout.recoveryBanner.verificationTitle")
                : isPainRecovery
                  ? t("workout.recoveryBanner.painTitle")
                  : t("workout.recoveryBanner.deloadTitle")}
            </Text>

            <Text
              style={{
                color: palette.textMuted,
                fontSize: 13,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              {isVerification
                ? t("workout.recoveryBanner.verificationBody")
                : isPainRecovery
                  ? t("workout.recoveryBanner.painBody")
                  : t("workout.recoveryBanner.deloadBody", { multiplier: deloadContext.restMultiplier })}
            </Text>
          </View>
        )}

        {/* Screen content */}

        {!started ? (
          <ScrollView style={{ width: "100%" }} contentContainerStyle={{ paddingBottom: 16 }}>
            <Text style={styles.title}>
              {isVerification
                ? t("workout.title.verification")
                : isPainRecovery
                  ? t("workout.title.recovery")
                  : isReducedDeload
                    ? t("workout.title.deload")
                    : t("workout.title.standard")}
            </Text>

            <View style={styles.exerciseList}>
              {!isPainRecovery && (
                <Text
                  style={{
                    color: palette.primary,
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  {t("workout.tapExerciseInstructionsLive")}
                </Text>
              )}

              {isPainRecovery ? (
                <View style={styles.exerciseCard}>
                  <Text style={styles.exerciseName}>
                    🛡️ {t("workout.painRecovery.dayTitle", { day: dayIndex + 1 })}
                  </Text>
                  <Text style={styles.exerciseType}>
                    {t("workout.painRecovery.previewBody")}
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
                        {getExerciseIcon(previewExercise.type)} {exerciseName(previewExercise.exerciseId ?? previewExercise.id, previewExercise.name)}
                      </Text>

                      <View style={styles.exerciseMeta}>
                        <Text style={styles.exerciseType}>
                          {exerciseType(previewExercise.type)} • {t("workout.setsCount", { count: previewExercise.sets })}
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
                {t("workout.estimatedWorkoutTime", { minutes: estimatedMinutes })}
              </Text>
            )}

            <PrimaryButton
              title={isPainRecovery ? t("workout.startRecovery") : isReducedDeload ? t("workout.startDeload") : isVerification ? t("workout.startVerification") : t("workout.start")}
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
              paddingBottom: 16,
            }}
          >
            {isPainRecovery ? (
              <View
                style={{
                  width: "92%",
                  padding: 18,
                  borderRadius: 12,
                  backgroundColor: palette.surface,
                  marginTop: 18,
                }}
              >
                <Text
                  style={{
                    color: palette.info,
                    fontSize: 22,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  🛡️ {t("workout.painRecovery.dayTitle", { day: dayIndex + 1 })}
                </Text>

                <Text
                  style={{
                    color: palette.textMuted,
                    fontSize: 15,
                    lineHeight: 22,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  {t("workout.painRecovery.activeBody")}
                </Text>

                <Text
                  style={{
                    color: palette.info,
                    fontWeight: "700",
                    marginTop: 20,
                    marginBottom: 8,
                  }}
                >
                  {t("workout.painRecovery.choice")}
                </Text>

                {[
                  ["guided-mobility", t("workout.painRecovery.guidedMobility")],
                  ["walking", t("recovery.walk")],
                  ["easy-cycling", t("recovery.cycling")],
                  ["mobility", t("recovery.mobility")],
                  ["other", t("recovery.other")],
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
                        borderColor: selected ? palette.info : palette.border,
                        backgroundColor: selected ? palette.primarySoft : palette.surfaceAlt,
                        borderRadius: 10,
                        paddingVertical: 11,
                        paddingHorizontal: 12,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: selected ? palette.primaryText : palette.text, fontWeight: selected ? "700" : "500" }}>
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
                      backgroundColor: palette.surfaceAlt,
                    }}
                  >
                    <Text
                      style={{
                        color: palette.info,
                        fontWeight: "700",
                        marginBottom: 10,
                      }}
                    >
                      {t("workout.painRecovery.selectGuided")}
                    </Text>

                    {[
                      {
                        key: "warmup",
                        label: t("workout.painRecovery.dynamicWarmups"),
                        selected: guidedIncludeWarmup,
                        onPress: () =>
                          setGuidedIncludeWarmup((value) => !value),
                      },
                      {
                        key: "stretch",
                        label: t("recovery.staticStretches"),
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
                          borderColor: option.selected ? palette.info : palette.border,
                          backgroundColor: option.selected
                            ? palette.primarySoft
                            : palette.surfaceAlt,
                          borderRadius: 10,
                          paddingVertical: 11,
                          paddingHorizontal: 12,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: palette.text,
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
                        {t("workout.painRecovery.selectGuidedRequired")}
                      </Text>
                    )}
                  </View>
                )}

                {recoveryActivityType !== "guided-mobility" && (
                  <>
                    <Text style={styles.recoveryFieldLabel}>
                      {t("workout.painRecovery.durationOptional")}
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
                        <Text style={styles.recoveryDurationUnit}>{t("unit.hours")}</Text>

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
                        <Text style={styles.recoveryDurationUnit}>{t("unit.minutes")}</Text>

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
                      {t("workout.painRecovery.distanceOptional")}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                      <TextInput
                        value={recoveryDistance}
                        onChangeText={setRecoveryDistance}
                        keyboardType="decimal-pad"
                        placeholder={t("workout.painRecovery.distancePlaceholder")}
                        placeholderTextColor={palette.textMuted}
                        style={{
                          flex: 1,
                          color: palette.text,
                          borderWidth: 1,
                          borderColor: palette.border,
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
                              recoveryDistanceUnit === unit ? palette.info : palette.border,
                            backgroundColor:
                              recoveryDistanceUnit === unit ? palette.primarySoft : palette.surfaceAlt,
                            borderRadius: 10,
                            paddingHorizontal: 10,
                          }}
                        >
                          <Text style={{ color: palette.text, fontWeight: "700" }}>
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.recoveryHelperText}>
                      {recoveryActivityType === "walking" ||
                      recoveryActivityType === "easy-cycling"
                        ? t("workout.painRecovery.durationOrDistanceRequired")
                        : recoveryActivityType === "other"
                          ? t("workout.painRecovery.otherHelper")
                          : t("workout.painRecovery.optionalHelper")}
                    </Text>

                    {recoveryActivityType === "other" && (
                      <TextInput
                        value={recoveryNotes}
                        onChangeText={setRecoveryNotes}
                        placeholder={t("workout.painRecovery.notesPlaceholder")}
                        placeholderTextColor={palette.textMuted}
                        style={{
                          color: palette.text,
                          borderWidth: 1,
                          borderColor: palette.border,
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
                      ? t("workout.completeGuidedRecovery")
                      : t("workout.saveActiveRecovery")
                  }
                  onPress={handleCompletePainRecoveryMain}
                  disabled={!isRecoveryFormValid}
                />
              </View>
            ) : currentExercise && (
              <>
                <Text style={styles.title}>
                  {getExerciseIcon(currentExercise.type)} {exerciseName(currentExercise.exerciseId ?? currentExercise.id, currentExercise.name)}
                </Text>

                <Text style={styles.exerciseDescription}>
                  {currentExercise.description}
                </Text>

                <Text style={styles.state}>
                  {t("workout.setProgress", { completed: sets.length, total: currentExercise.sets })}
                </Text>

                {isReducedDeload && currentExercise.matchOrBeatTargets?.some((target) => target.target != null) && (
                  <Text
                    style={{
                      color: palette.info,
                      marginTop: 8,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {t("workout.recoveryTarget.mbPaused")}
                  </Text>
                )}

                {isVerification && (
                  <Text
                    style={{
                      color: palette.accent,
                      marginTop: 8,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {t("workout.recoveryTarget.verification")}
                  </Text>
                )}
              </>
            )}

            {phase === "rate-exercise" && currentExercise && (
              <View style={styles.visualContainer}>
                <Text style={styles.phaseText}>{t("workout.exerciseFeel")}</Text>
                <Text
                  style={{
                    color: palette.textMuted,
                    fontSize: 14,
                    textAlign: "center",
                    marginTop: 8,
                    marginBottom: 18,
                  }}
                >
                  {t("workout.quickRating", { exercise: exerciseName(currentExercise.exerciseId ?? currentExercise.id, currentExercise.name) })}
                </Text>

                <View
                  style={{
                    width: "100%",
                    gap: 10,
                  }}
                >
                  <PrimaryButton
                    title={t("workout.rating.tooEasy")}
                    onPress={() => completeExerciseTransition(1)}
                  />
                  <PrimaryButton
                    title={t("workout.rating.justRight")}
                    onPress={() => completeExerciseTransition(2)}
                  />
                  <PrimaryButton
                    title={t("workout.rating.tooHard")}
                    onPress={() => completeExerciseTransition(3)}
                  />
                </View>
              </View>
            )}

            {/* REST UI */}

            {(phase === "rest-set" || phase === "rest-exercise") && (
              <View style={styles.visualContainer}>
                {phase === "rest-set" ? (
                  <>
                    <Text style={styles.phaseText}>{t("workout.restBetweenSets")}</Text>

                    <Animated.Text
                      style={[
                        styles.bigTimer,
                        {
                          color:
                            restTimeLeft <= alertThreshold ? "#FF4C4C" : palette.text,
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
                        color: palette.textMuted,
                        fontSize: 16,
                      }}
                    >
                      {t("workout.upNext")}
                    </Text>

                    {nextExercise && (
                      <>
                        <Text
                          style={{
                            color: palette.primary,
                            fontSize: 26,
                            fontWeight: "bold",
                            marginTop: 10,
                            textAlign: "center",
                          }}
                        >
                          {getExerciseIcon(nextExercise.type)}{" "}
                          {exerciseName(nextExercise.exerciseId ?? nextExercise.id, nextExercise.name)}
                        </Text>

                        <Text
                          style={{
                            color: palette.textMuted,
                            marginTop: 5,
                          }}
                        >
                          {t("workout.setsCount", { count: nextExercise.sets })} • {nextExercise.type}
                        </Text>
                      </>
                    )}

                    <Text
                      style={{
                        color: palette.textMuted,
                        fontSize: 16,
                        marginTop: 20,
                      }}
                    >
                      {t("workout.startingIn")}
                    </Text>

                    <Animated.Text
                      style={[
                        styles.bigTimer,
                        {
                          color:
                            restTimeLeft <= alertThreshold ? "#FF4C4C" : palette.text,
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

                {currentRestDecision &&
                  currentRestDecision.adaptiveAdjustmentSeconds > 0 && (
                    <Text
                      style={{
                        color: palette.info,
                        marginTop: 10,
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      {currentRestDecision.performanceDropOffPercent != null
                        ? t("workout.adaptiveRest.performanceDrop", {
                            seconds: currentRestDecision.adaptiveAdjustmentSeconds,
                            percent: Math.round(currentRestDecision.performanceDropOffPercent),
                          })
                        : t("workout.adaptiveRest.veryHard", {
                            seconds: currentRestDecision.adaptiveAdjustmentSeconds,
                          })}
                    </Text>
                  )}

                {restTimeLeft === 0 && (
                  <Animated.Text
                    style={{
                      fontSize: 48,
                      fontWeight: "bold",
                      color: palette.accent,
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

                <View style={{ width: "100%", marginTop: 18 }}>
                  <PrimaryButton title={t("workout.skipRest")} onPress={handleSkipRest} />
                </View>
              </View>
            )}

            {/* TEMPO */}

            {currentExercise?.type === "tempo" && phase === "active" && (
              <TempoExercise
                exerciseName={exerciseName(currentExercise.exerciseId ?? currentExercise.id, currentExercise.name)}
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
                isBaselineWeek={week === 0}
              />
            )}

            {/* HOLD */}

            {currentExercise?.type === "hold" && phase === "active" && (
              <HoldExercise
                exerciseName={exerciseName(currentExercise.exerciseId ?? currentExercise.id, currentExercise.name)}
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
                isBaselineWeek={week === 0}
                recoveryTimerState={
                  recoveryTimerState?.kind === "hold"
                    ? recoveryTimerState
                    : null
                }
                onRecoveryTimerStateChange={setRecoveryTimerState}
              />
            )}

            {/* REPS */}

            {currentExercise?.type === "reps" && phase === "active" && (
              <RepsExercise
                exerciseName={exerciseName(currentExercise.exerciseId ?? currentExercise.id, currentExercise.name)}
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
                isBaselineWeek={week === 0}
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
          onExerciseGuide={handleOpenExerciseGuide}
          showExerciseGuide={Boolean(
            phase === "rest-exercise" ? nextExercise : currentExercise,
          )}
          showSkipSet={phase === "active"}
          showSkipExercise={phase === "active"}
          showSkipSection={phase === "active"}
        />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

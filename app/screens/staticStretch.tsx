import AbortCoach from "@/components/AbortCoach";
import { recordAbortedWorkout } from "@/utils/createAbortAttempt";
import { AbortReason } from "@/models/AbortAttempt";
import { useTranslation } from "@/hooks/useTranslation";
//app/screens/staticStretch.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Alert,
  View,
  Text,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStyles } from "../../styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
// import { soundManager } from "../../services/SoundManagerExpoAv";
import { soundManager } from "../../services/SoundManager";
import { staticStretches } from "../../data/staticStretches";
import { StretchExercise } from "../../models/stretchRoutine";
import { useLocalSearchParams, router } from "expo-router";
import AppIcon from "../../components/AppIcon";
import TopAppBar from "@/components/TopAppBar";
import WorkoutMenu from "@/components/WorkoutMenu";
import { calculateWorkoutStats } from "@/utils/calculateWorkoutStats";
import { hydrateExercise } from "@/utils/hydrateExercise";
import PrimaryButton from "@/components/PrimaryButton";
import WorkoutProgress from "@/components/WorkoutProgress";
import { useActiveWorkoutCheckpoint } from "@/hooks/useActiveWorkoutCheckpoint";
import { usePreventWorkoutBackNavigation } from "@/hooks/usePreventWorkoutBackNavigation";
import { clearActiveWorkout } from "@/storage/activeWorkoutStorage";

type FlattenedStretchExercise = ReturnType<typeof hydrateExercise> &
  StretchExercise & {
    side?: string;
    id: string;
  };

export default function StaticStretch() {
  const appStyles = useAppStyles();
  const palette = useAppPalette();
  const { t, exerciseName } = useTranslation();
  usePreventWorkoutBackNavigation();
  const params = useLocalSearchParams();
  const startWorkoutTime = params.startWorkoutTime as string;

  const dayIndex = Number(params.dayIndex ?? 0);

  const blockIndex = Number(params.blockIndex ?? 0);
  const recoveryState = React.useMemo(() => {
    try { return params.recoveryState ? JSON.parse(params.recoveryState as string) : {}; } catch { return {}; }
  }, [params.recoveryState]);
  // const session = JSON.parse(params.session as string);
  const [session, setSession] = useState(() =>
    JSON.parse(params.session as string),
  );

  const [currentTimer, setCurrentTimer] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>(recoveryState.completed ?? []);
  const [skipped, setSkipped] = useState<string[]>(recoveryState.skipped ?? []);

  const intervalRef = useRef<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(
    Number(recoveryState.currentIndex ?? 0),
  );
  const listRef = useRef<FlatList<FlattenedStretchExercise>>(null);
  const [isStarting, setIsStarting] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);


  useActiveWorkoutCheckpoint({
    screen: "staticStretch",
    blockIndex,
    session,
    activeBlockId: session.blocks?.[blockIndex]?.id,
    screenState: { currentIndex, completed, skipped },
  });

  // Start timer
  const startTimer = async (id: string, seconds: number) => {
    if (isStarting) return; // prevent double press

    setIsStarting(true);
    setActiveExerciseId(id);
    setCurrentTimer(seconds);

    await soundManager.playReadySetGoSound(true);

    intervalRef.current = setInterval(() => {
      setCurrentTimer((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          soundManager.playStop();
          completeExercise(id);
          return null;
        }

        if (prev % 2 === 0) {
          soundManager.playTick();
        }

        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (activeExerciseId) completeExercise(activeExerciseId);
  };

  const completeExercise = (id: string) => {
    setCompleted((c) => (c.includes(id) ? c : [...c, id]));
    setActiveExerciseId(null);
    setCurrentTimer(null);
    setIsStarting(false);
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;

      // only scroll if next item exists
      if (nextIndex < flattenedExercises.length) {
        listRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }
      return nextIndex;
    });
  };

  useEffect(() => {
    if (currentIndex >= flattenedExercises.length) {
      const updatedBlocks = [...session.blocks];

      // const updatedSession = {
      //   ...session,
      //   blocks: updatedBlocks,
      //   results: {
      //     ...session.results,
      //     stretchCompleted: true,
      //   },
      // };

      const updatedSession = {
        ...session,
        blocks: updatedBlocks,
        results: {
          ...session.results,
          stretchCompleted: true,

          stretch: {
            completed,
            skipped,
            sectionSkipped: false,
          },
        },
      };

      router.replace({
        pathname: "/screens/workoutRunner",
        params: {
          session: JSON.stringify(updatedSession),
          blockIndex: String(Number(params.blockIndex) + 1),
          startWorkoutTime, // Expo Router params are strings
        },
      });
    }
  }, [currentIndex]);

  // skip exercise
  const handleSkipExercise = () => {
    if (currentIndex >= flattenedExercises.length) return;

    const exercise = flattenedExercises[currentIndex];

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setSkipped((s) => (s.includes(exercise.id) ? s : [...s, exercise.id]));

    setActiveExerciseId(null);
    setCurrentTimer(null);
    setIsStarting(false);

    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;

      if (nextIndex < flattenedExercises.length) {
        listRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }

      return nextIndex;
    });

    setMenuVisible(false);
  };

  // skip section
  const handleSkipSection = () => {
    setMenuVisible(false);

    // Stop any active timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setActiveExerciseId(null);
    setCurrentTimer(null);
    setIsStarting(false);

    // Everything not already completed or skipped
    // becomes skipped.
    const remainingExerciseIds = flattenedExercises
      .map((exercise) => exercise.id)
      .filter(
        (exerciseId) =>
          !completed.includes(exerciseId) && !skipped.includes(exerciseId),
      );

    const updatedSkipped = Array.from(
      new Set([...skipped, ...remainingExerciseIds]),
    );

    // ---------------------------------
    // Complete the current block
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

    const updatedSession = {
      ...session,

      blocks: updatedBlocks,

      results: {
        ...session.results,

        stretch: {
          completed: [...completed],
          skipped: updatedSkipped,
          sectionSkipped: true,
        },
      },
    };

    const nextBlockIndex = blockIndex + 1;

    // No more sections — go directly to summary.
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

    // Continue with the next section.
    router.replace({
      pathname: "/screens/workoutRunner",
      params: {
        session: JSON.stringify(updatedSession),
        blockIndex: String(nextBlockIndex),
        startWorkoutTime,
      },
    });
  };

  // abort workout
  // Interrupt the entire session without recording workout completion.
  const handlePainInterruption = () => {
    setMenuVisible(false);
    Alert.alert(
      t("workout.painStopTitle"),
      t("workout.painStopBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("workout.painStopConfirm"),
          style: "destructive",
          onPress: async () => {
            await recordAbortedWorkout({
              session, stage: "staticStretch", reason: "pain", startWorkoutTime,
              programId: typeof params.programId === "string" ? params.programId : undefined,
              dayId: typeof params.dayId === "string" ? params.dayId : undefined,
              completed, skipped,
            });
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setActiveExerciseId(null);
            setCurrentTimer(null);
            setIsStarting(false);
            await clearActiveWorkout();
            router.replace({
              pathname: "/screens/painCoach",
              params: {
                triggeredAtWeekIndex: String(params.weekIndex ?? params.week ?? session.weekIndex ?? session.week ?? 0),
                lifecycleRequiresRecovery: "false",
                interruptionDuringRecovery: String(Boolean(recoveryState.isPainRecovery ?? params.isPainRecovery)),
              },
            });
          },
        },
      ],
    );
  };

  const [abortCoachVisible, setAbortCoachVisible] = useState(false);
  const handleAbortWorkout = () => {
    setMenuVisible(false);
    setAbortCoachVisible(true);
  };
  const confirmAbort = async (reason: AbortReason, notes: string) => {
    await recordAbortedWorkout({
      session, stage: "staticStretch", reason, notes, startWorkoutTime,
      programId: typeof params.programId === "string" ? params.programId : undefined,
      dayId: typeof params.dayId === "string" ? params.dayId : undefined,
      completed, skipped,
    });
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    await clearActiveWorkout();
    setAbortCoachVisible(false);
    router.replace("/");
  };

  // 🔹 Flatten + hydrate exercises
  const flattenedExercises = useMemo<FlattenedStretchExercise[]>(() => {
    return staticStretches.exercises.flatMap((exercise) => {
      const hydrated = hydrateExercise(exercise);

      if (exercise.config.perSide) {
        return [
          {
            ...hydrated,
            config: exercise.config,
            side: t("common.left"),
            id: `${hydrated.id}_left`,
          },
          {
            ...hydrated,
            config: exercise.config,
            side: t("common.right"),
            id: `${hydrated.id}_right`,
          },
        ];
      }

      return [
        {
          ...hydrated,
          config: exercise.config,
          id: hydrated.id,
        },
      ];
    });
  }, []);

  // 🔹 THEN compute stats
  const stats = useMemo(() => {
    return calculateWorkoutStats(flattenedExercises);
  }, [flattenedExercises]);

  // 🔹 Render item
  const renderItem = ({
    item,
    index,
  }: {
    item: FlattenedStretchExercise;
    index: number;
  }) => {
    const isDone = completed.includes(item.id);
    const isSkipped = skipped.includes(item.id);
    const isActive = activeExerciseId === item.id;
    const isEnabled = index === currentIndex;

    return (
      <Pressable
        style={appStyles.exerciseCard}
        android_ripple={{ color: palette.surfaceAlt }}
        onPress={() =>
          router.push({
            pathname: "/screens/exerciseGuideScreen",
            params: { exerciseId: item.exerciseId },
          })
        }
      >
        <Text style={appStyles.exerciseName}>
          {exerciseName(item.exerciseId ?? item.id, item.name)} {item.side ? `- ${item.side}` : ""}
        </Text>
        <View style={appStyles.exerciseMeta}>
          <Text style={appStyles.exerciseType}>{t("warmup.type")}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {/* <Text style={appStyles.exerciseSets}>
              {item.config.durationSeconds}s
            </Text> */}
            {/* <Text
              style={{
                color: palette.primary,
                fontSize: 22,
                fontWeight: "bold",
              }}
            >
              🛈
            </Text> */}
            <AppIcon name="information-circle" />
          </View>
        </View>

        {item.type === "time" && isActive && (
          <View style={{ alignItems: "center", marginVertical: 10 }}>
            <Text style={appStyles.bigTimer}>{currentTimer}</Text>
          </View>
        )}

        {!isDone && !isSkipped && item.type === "time" && !isActive && (
          <PrimaryButton
            title={isEnabled && !isStarting ? t("common.start") : t("common.locked")}
            disabled={!isEnabled || isStarting}
            onPress={() => startTimer(item.id, item.config.durationSeconds)}
          />
        )}

        {/* ACTIVE */}
        {/* {isActive && (
          <Pressable
            style={[
              appStyles.button,
              appStyles.stopButton,
              !isStarting && { opacity: 0.4 }, // visually disabled if not starting
            ]}
            disabled={!isStarting} // disable until timer actually started
            onPress={stopTimer}
          >
            <Text style={appStyles.buttonText}>{t("common.stop")}</Text>
          </Pressable>
        )} */}

        {isSkipped && <Text style={appStyles.setText}>{t("exercise.skipped")}</Text>}

        {isDone && !isSkipped && (
          <Text style={appStyles.setText}>{t("common.completed")}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={appStyles.container} edges={["bottom"]}>
        <View style={appStyles.headerContainer}>
          <TopAppBar
            effectiveness={stats.effectiveness}
            difficulty={stats.difficulty}
            onMenuPress={() => setMenuVisible(true)}
          />

          <WorkoutProgress blocks={session.blocks} />

          <Text style={appStyles.title}>{t("workout.progress.static")}</Text>

          <Text style={{ color: palette.primary, fontSize: 14, marginBottom: 10 }}>
            {t("workout.tapExerciseInstructionsLive")}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={flattenedExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            }, 200);
          }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
        <AbortCoach visible={abortCoachVisible} onCancel={() => setAbortCoachVisible(false)} onConfirm={confirmAbort} />
        <WorkoutMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onSkipExercise={handleSkipExercise}
          onSkipSection={handleSkipSection}
          onAbortWorkout={handleAbortWorkout}
          onPainInterruption={handlePainInterruption}
          showSkipExercise={true}
          showSkipSection={true}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

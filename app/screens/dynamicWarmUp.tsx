//app/screens/dynamicWarmUp.tsx
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
import PrimaryButton from "@/components/PrimaryButton";
import { appStyles } from "../../styles/appStyles";
import { soundManager } from "../../services/SoundManager";
import { dynamicWarmUp } from "../../data/dynamicWarmUp";
import { useLocalSearchParams, router } from "expo-router";
import AppIcon from "../../components/AppIcon";
import TopAppBar from "@/components/TopAppBar";
import WorkoutMenu from "@/components/WorkoutMenu";
import { calculateWorkoutStats } from "@/utils/calculateWorkoutStats";
import { hydrateExercise } from "@/utils/hydrateExercise";
import WorkoutProgress from "@/components/WorkoutProgress";

export default function DynamicWarmUp() {
  const params = useLocalSearchParams();
  const startWorkoutTime = params.startWorkoutTime as string;

  const dayIndex = Number(params.dayIndex ?? 0);
  // const session = JSON.parse(params.session as string);
  const [session, setSession] = useState(() =>
    JSON.parse(params.session as string),
  );
  const blockIndex = Number(params.blockIndex ?? 0);

  const [currentTimer, setCurrentTimer] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  const [completed, setCompleted] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const listRef = useRef<FlatList>(null);

  const intervalRef = useRef<number | null>(null);

  const [isStarting, setIsStarting] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);

  // const stats = useMemo(() => {
  //   return calculateWorkoutStats(dynamicWarmUp.exercises);
  // }, []);

  const hydratedExercises = useMemo(() => {
    return dynamicWarmUp.exercises.map((ex) => hydrateExercise(ex));
  }, []);

  const stats = useMemo(() => {
    return calculateWorkoutStats(hydratedExercises);
  }, [hydratedExercises]);

  // Start timer for time-based exercises
  const startTimer = async (id: string, seconds: number) => {
    if (isStarting) return; // prevent double press

    setActiveExerciseId(id);
    setCurrentTimer(seconds);
    setIsStarting(true);

    await soundManager.playReadySetGoSound(true);

    intervalRef.current = setInterval(() => {
      setCurrentTimer((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          completeExercise(id);
          soundManager.playStop();
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
    if (!isStarting) return;
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

      if (nextIndex < hydratedExercises.length) {
        listRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }

      return nextIndex;
    });
  };

  const markDone = (id: string) => {
    completeExercise(id);
  };

  // skip the exercise
  const handleSkipExercise = () => {
    if (currentIndex >= hydratedExercises.length) return;

    const exercise = hydratedExercises[currentIndex];

    // Mark the exercise as skipped
    setSkipped((s) => (s.includes(exercise.id) ? s : [...s, exercise.id]));

    setActiveExerciseId(null);
    setCurrentTimer(null);
    setIsStarting(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Move to the next exercise
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;

      if (nextIndex < hydratedExercises.length) {
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

  // skip the section

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

    // Everything not already completed or skipped becomes skipped.
    const remainingExerciseIds = hydratedExercises
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

        warmup: {
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

  // abort all
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
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            setActiveExerciseId(null);
            setCurrentTimer(null);
            setIsStarting(false);
            setCompleted([]);
            setSkipped([]);

            router.replace("/");
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (currentIndex >= hydratedExercises.length) {
      const updatedBlocks = [...session.blocks];

      // WorkoutRunner now owns block timestamps and status.

      // const updatedSession = {
      //   ...session,
      //   blocks: updatedBlocks,
      //   results: {
      //     ...session.results,
      //     warmupCompleted: true,
      //   },
      // };
      const updatedSession = {
        ...session,
        blocks: updatedBlocks,
        results: {
          ...session.results,

          warmupCompleted: true,

          warmup: {
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
          blockIndex: String(blockIndex + 1),
          startWorkoutTime, // Expo Router params are strings
        },
      });
    }
  }, [currentIndex]);

  // Render each exercise card
  const renderItem = ({ item, index }: any) => {
    const isDone = completed.includes(item.id);
    const isSkipped = skipped.includes(item.id);
    const isActive = activeExerciseId === item.id;
    const isEnabled = index === currentIndex;

    return (
      <Pressable
        style={appStyles.exerciseCard}
        android_ripple={{ color: "#333" }}
        onPress={() =>
          router.push({
            pathname: "/screens/exerciseGuideScreen",
            params: { exerciseId: item.id },
          })
        }
      >
        <Text style={appStyles.exerciseName}>{item.name}</Text>
        <View style={appStyles.exerciseMeta}>
          <Text style={appStyles.exerciseType}>stretch</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppIcon name="information-circle" />
          </View>
        </View>
        <Text style={{ color: "#FFD700", fontSize: 14, marginBottom: 10 }}>
          Tap an exercise for instructions →
        </Text>

        {item.type === "reps" && (
          <Text style={appStyles.historyText}>
            {item.config.reps} reps
            {item.config.perSide && ` (${item.config.reps / 2} reps each side)`}
          </Text>
        )}

        {item.type === "time" && isActive && (
          <View style={{ alignItems: "center", marginVertical: 10 }}>
            <Text style={appStyles.bigTimer}>{currentTimer}</Text>
          </View>
        )}

        {/* REPS */}
        {item.type === "reps" && !isDone && (
          <PrimaryButton
            title={isEnabled ? "Done" : "Locked"}
            disabled={!isEnabled}
            onPress={() => markDone(item.id)}
          />
        )}

        {/* TIME - START */}
        {item.type === "time" && !isDone && !isActive && (
          <PrimaryButton
            title={isEnabled ? "Start" : "Locked"}
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
            <Text style={appStyles.buttonText}>Stop</Text>
          </Pressable>
        )} */}

        {/* SKIPPED */}
        {isSkipped && <Text style={appStyles.setText}>⏭ Skipped</Text>}

        {/* DONE */}
        {isDone && !isSkipped && (
          <Text style={appStyles.setText}>Completed ✓</Text>
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
        {/* Header / Title */}
        <View style={appStyles.headerContainer}>
          <TopAppBar
            effectiveness={stats.effectiveness}
            difficulty={stats.difficulty}
            onMenuPress={() => setMenuVisible(true)}
          />

          <WorkoutProgress blocks={session.blocks} />

          <Text style={appStyles.title}>{dynamicWarmUp.title}</Text>
        </View>

        {/* FlatList for scrolling exercises */}
        <FlatList
          ref={listRef}
          data={hydratedExercises}
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
        <WorkoutMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onSkipExercise={handleSkipExercise}
          onSkipSection={handleSkipSection}
          onAbortWorkout={handleAbortWorkout}
          showSkipExercise={true}
          showSkipSection={true}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

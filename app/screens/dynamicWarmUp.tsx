import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable, Dimensions } from "react-native";

import { appStyles } from "../../styles/appStyles";
import { soundManager } from "../../services/SoundManagerExpoAv";
import { dynamicWarmUp } from "../../data/dynamicWarmUp";
import { useLocalSearchParams, router } from "expo-router";
import AppIcon from "../../components/AppIcon";
import TopAppBar from "@/components/TopAppBar";
import { calculateWorkoutStats } from "@/utils/calculateWorkoutStats";
import { useMemo } from "react";

export default function DynamicWarmUp() {
  const params = useLocalSearchParams();
  const dayIndex = Number(params.dayIndex ?? 0);
  const session = JSON.parse(params.session as string);
  const blockIndex = Number(params.blockIndex ?? 0);

  const [currentTimer, setCurrentTimer] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const intervalRef = useRef<number | null>(null);

  const [isStarting, setIsStarting] = useState(false);

  const stats = useMemo(() => {
    return calculateWorkoutStats(dynamicWarmUp.exercises);
  }, []);

  useEffect(() => {
    soundManager.loadSounds();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Start timer for time-based exercises
  const startTimer = async (id: string, seconds: number) => {
    if (isStarting) return; // prevent double press

    setActiveExerciseId(id);
    await soundManager.playReadySetGoSound(true);
    setCurrentTimer(seconds);
    setIsStarting(true);

    intervalRef.current = setInterval(() => {
      setCurrentTimer((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          completeExercise(id);
          return null;
        }

        if (prev <= 3) {
          soundManager.playCountdownBeep();
        } else {
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

      if (nextIndex < dynamicWarmUp.exercises.length) {
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

  useEffect(() => {
    if (currentIndex >= dynamicWarmUp.exercises.length) {
      const updatedSession = {
        ...session,
        results: {
          ...session.results,
          warmupCompleted: true,
        },
      };

      router.replace({
        pathname: "/screens/workoutRunner",
        params: {
          session: JSON.stringify(updatedSession),
          blockIndex: String(blockIndex + 1),
        },
      });
    }
  }, [currentIndex]);

  // Render each exercise card
  const renderItem = ({ item, index }: any) => {
    const isDone = completed.includes(item.id);
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
            {/* <Text
      style={{
        color: "#FFD700",
        fontSize: 22,
        fontWeight: "bold",
      }}
    >
      🛈
    </Text> */}
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
          <Pressable
            style={[appStyles.button, !isEnabled && { opacity: 0.4 }]}
            disabled={!isEnabled}
            onPress={() => markDone(item.id)}
          >
            <Text style={appStyles.buttonText}>
              {isEnabled ? "Done" : "Locked"}
            </Text>
          </Pressable>
        )}

        {/* TIME - START */}
        {item.type === "time" && !isDone && !isActive && (
          <Pressable
            style={[
              appStyles.button,
              (!isEnabled || isStarting) && { opacity: 0.4 },
            ]}
            disabled={!isEnabled || isStarting}
            onPress={() => startTimer(item.id, item.config.durationSeconds)}
          >
            <Text style={appStyles.buttonText}>
              {isEnabled ? "Start" : "Locked"}
            </Text>
          </Pressable>
        )}

        {/* ACTIVE */}
        {isActive && (
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
        )}

        {/* DONE */}
        {isDone && <Text style={appStyles.setText}>Completed ✓</Text>}
      </Pressable>
    );
  };

  return (
    <View style={appStyles.screen}>
      {/* Header / Title */}
      <View style={appStyles.headerContainer}>
        <TopAppBar
          effectiveness={stats.effectiveness}
          difficulty={stats.difficulty}
        />

        <Text style={appStyles.title}>{dynamicWarmUp.title}</Text>
      </View>

      {/* FlatList for scrolling exercises */}
      <FlatList
        ref={listRef}
        data={dynamicWarmUp.exercises}
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
    </View>
  );
}

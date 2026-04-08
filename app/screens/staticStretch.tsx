import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable } from "react-native";

import { appStyles } from "../../styles/appStyles";
import { soundManager } from "../../services/SoundManagerExpoAv";
import { staticStretches } from "../../data/staticStretches";
import { StretchExercise } from "../../models/stretchRoutine";
import { useLocalSearchParams, router } from "expo-router";

interface FlattenedStretchExercise extends StretchExercise {
  side?: string;
  id: string;
}

export default function StaticStretch() {
  const params = useLocalSearchParams();
  const dayIndex = Number(params.dayIndex ?? 0);
  const session = JSON.parse(params.session as string);
  const [currentTimer, setCurrentTimer] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const intervalRef = useRef<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<FlattenedStretchExercise>>(null);
  const [isStarting, setIsStarting] = useState(false);
  useEffect(() => {
    soundManager.loadSounds();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Start timer
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
          if (intervalRef.current) clearInterval(intervalRef.current);
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
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (activeExerciseId) completeExercise(activeExerciseId);
  };

  const completeExercise = (id: string) => {
    setCompleted((c) => [...c, id]);
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
      const updatedSession = {
        ...session,
        results: {
          ...session.results,
          stretchCompleted: true,
        },
      };

      router.replace({
        pathname: "/screens/workoutRunner",
        params: {
          session: JSON.stringify(updatedSession),
          blockIndex: String(Number(params.blockIndex) + 1),
        },
      });
    }
  }, [currentIndex]);
  // 🔹 Flatten exercises
  const flattenedExercises = React.useMemo(() => {
    return staticStretches.exercises.flatMap((ex) => {
      if (ex.config.perSide) {
        return [
          { ...ex, id: ex.id + "_left", side: "Left" },
          { ...ex, id: ex.id + "_right", side: "Right" },
        ];
      }
      return [{ ...ex }];
    });
  }, []);

  // 🔹 Render item
  const renderItem = ({
    item,
    index,
  }: {
    item: FlattenedStretchExercise;
    index: number;
  }) => {
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
        <Text style={appStyles.exerciseName}>
          {item.name} {item.side ? `- ${item.side}` : ""}
        </Text>
        <View style={appStyles.exerciseMeta}>
          <Text style={appStyles.exerciseType}>stretch</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {/* <Text style={appStyles.exerciseSets}>
              {item.config.durationSeconds}s
            </Text> */}
            <Text
              style={{
                color: "#FFD700",
                fontSize: 22,
                fontWeight: "bold",
              }}
            >
              🛈
            </Text>
          </View>
        </View>

        {item.type === "time" && isActive && (
          <View style={{ alignItems: "center", marginVertical: 10 }}>
            <Text style={appStyles.bigTimer}>{currentTimer}</Text>
          </View>
        )}

        {!isDone && item.type === "time" && !isActive && (
          <Pressable
            style={[
              appStyles.button,
              (!isEnabled || isStarting) && { opacity: 0.4 }, // visually disabled
            ]}
            disabled={!isEnabled}
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

        {isDone && <Text style={appStyles.setText}>Completed ✓</Text>}
      </Pressable>
    );
  };

  return (
    <View style={appStyles.screen}>
      <View style={appStyles.headerContainer}>
        <Text style={appStyles.title}>{staticStretches.title}</Text>
        <Text style={{ color: "#FFD700", fontSize: 14, marginBottom: 10 }}>
          Tap an exercise for instructions →
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
    </View>
  );
}

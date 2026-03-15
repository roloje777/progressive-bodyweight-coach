import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Pressable, Dimensions } from "react-native";

import { appStyles } from "../styles/appStyles";
import { soundManager } from "../services/SoundManager";
import { dynamicWarmUp } from "../../data/dynamicWarmUp";

export default function DynamicWarmUp() {
  const [currentTimer, setCurrentTimer] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    soundManager.loadSounds();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Start timer for time-based exercises
  const startTimer = async (id: string, seconds: number) => {
    setActiveExerciseId(id);
    await soundManager.playReadySetGoSound();
    setCurrentTimer(seconds);

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
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (activeExerciseId) completeExercise(activeExerciseId);
  };

  const completeExercise = (id: string) => {
    setCompleted((c) => [...c, id]);
    setActiveExerciseId(null);
    setCurrentTimer(null);
  };

  const markDone = (id: string) => {
    completeExercise(id);
  };

  // Render each exercise card
  const renderItem = ({ item }: any) => {
    const isDone = completed.includes(item.id);
    const isActive = activeExerciseId === item.id;

    return (
      <View style={appStyles.exerciseCard}>
        <Text style={appStyles.exerciseTitle}>{item.name}</Text>

        {item.type === "reps" && (
          <Text style={appStyles.historyText}>
            {item.config.reps} reps {item.config.perSide ? "(each side)" : ""}
          </Text>
        )}

        {item.type === "time" && isActive && (
          <View style={{ alignItems: "center", marginVertical: 10 }}>
            <Text style={appStyles.bigTimer}>{currentTimer}</Text>
          </View>
        )}

        {/* Buttons */}
        {!isDone && item.type === "reps" && (
          <Pressable style={appStyles.button} onPress={() => markDone(item.id)}>
            <Text style={appStyles.buttonText}>Done</Text>
          </Pressable>
        )}

        {!isDone && item.type === "time" && !isActive && (
          <Pressable
            style={appStyles.button}
            onPress={() => startTimer(item.id, item.config.durationSeconds)}
          >
            <Text style={appStyles.buttonText}>Start</Text>
          </Pressable>
        )}

        {isActive && (
          <Pressable
            style={[appStyles.button, appStyles.stopButton]}
            onPress={stopTimer}
          >
            <Text style={appStyles.buttonText}>Stop</Text>
          </Pressable>
        )}

        {isDone && <Text style={appStyles.setText}>Completed ✓</Text>}
      </View>
    );
  };

  return (
    <View style={appStyles.screen}>
      {/* Header / Title */}
      <View style={appStyles.headerContainer}>
        <Text style={appStyles.title}>{dynamicWarmUp.title}</Text>
      </View>

      {/* FlatList for scrolling exercises */}
      <FlatList
        data={dynamicWarmUp.exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
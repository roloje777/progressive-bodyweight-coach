import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
 } from "react-native";
import { soundManager } from "../services/SoundManager";
import { useHoldTimer } from "../../timers/useHoldTimer";
import { appStyles as styles } from "../styles/appStyles";

interface HoldExerciseProps {
  exerciseName: string;
  totalSets: number;
  duration: number;
  sets: { durationSeconds: number }[];
  onSetComplete: (duration: number) => void;
}

export const HoldExercise: React.FC<HoldExerciseProps> = ({
  exerciseName,
  totalSets,
  duration,
  sets,
  onSetComplete,
}) => {
  const {
    elapsed,
    state,
    sets: internalSets,
    start,
    stop,
  } = useHoldTimer(duration, onSetComplete);

  const remaining = Math.max(duration - elapsed, 0);

  const handleStart = async () => {
  if (state === "running") return;

  await soundManager.playReadySetGoSound();
  start();
};

  /**
   * SOUND GUIDE
   */
  useEffect(() => {
    if (state !== "running") return;
    if (remaining <= 0) return;

    // LAST 5 SECONDS
    if (remaining <= 5) {
      soundManager.playCountdownBeep();
      return;
    }

    // HALF WAY MARK
    if (remaining === Math.floor(duration / 2)) {
      soundManager.playDoubleTick();
      return;
    }

    // EVERY 5 SECONDS
    if (remaining % 5 === 0) {
      soundManager.playTick();
    }
}, [elapsed, remaining, state, duration]);

  return (
    <View style={styles.container}>
      
      <Text style={styles.timer}>{remaining}s</Text>

      <TouchableOpacity
        style={[styles.button, state === "running" ? styles.stopButton : {}]}
        onPress={state === "running" ? stop : handleStart}
      >
        <Text style={styles.buttonText}>
          {state === "running" ? "Stop" : "Start"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={sets}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.setText}>
            Set {index + 1}: {item.durationSeconds}s
          </Text>
        )}
      />
    </View>
  );
};


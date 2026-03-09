import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { soundManager } from "../services/SoundManager";
import { useHoldTimer } from "../../timers/useHoldTimer";

interface HoldExerciseProps {
  exerciseName: string;
  totalSets: number;
  duration: number; // target duration
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
  const { elapsed, state, sets: internalSets, start, stop } = useHoldTimer(
    duration,
    onSetComplete
  );

  // Play beep sound when starting
  const handleStart = async () => {
    await soundManager.playGo();
    start();
  };

  const remaining = Math.max(duration - elapsed, 0);
  const currentSetNumber = internalSets.length + 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseName}</Text>
      <Text style={styles.currentSet}>
        Set {currentSetNumber} / {totalSets}
      </Text>

      <Text style={styles.timer}>{remaining}s</Text>

      <TouchableOpacity
        style={[styles.button, state === "running" ? styles.stopButton : {}]}
        onPress={state === "running" ? stop : handleStart}
      >
        <Text style={styles.buttonText}>{state === "running" ? "Stop" : "Start"}</Text>
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

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 10 },
  currentSet: { fontSize: 20, color: "#00FF00", marginVertical: 5 },
  timer: { fontSize: 50, color: "white", marginVertical: 10 },
  button: {
    margin: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
  },
  stopButton: { backgroundColor: "#FF0000" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
  setText: { color: "#FFD700", fontSize: 18, marginTop: 5 },
});
// app/(tabs)/workout.tsx
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import React from "react";
import { useHoldTimer } from "../../timers/useHoldTimer";

export default function Workout() {
  const { elapsed, state, sets, start, pause, stop, reset } = useHoldTimer();

  // Format seconds into mm:ss
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60).toString().padStart(2, "0");
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Determine the current set number
  const currentSetNumber = sets.length + (state === "running" || state === "paused" ? 1 : 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hold Timer</Text>

      {/* Current Set Display */}
      <Text style={styles.currentSet}>Set {currentSetNumber}</Text>

      {/* Timer Display */}
      <Text style={styles.timer}>{formatTime(elapsed)}</Text>

      {/* Start / Pause Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={start}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pause}>
          <Text style={styles.buttonText}>Pause</Text>
        </TouchableOpacity>
      </View>

      {/* Stop / Reset Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={stop}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={reset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* State & Sets Completed */}
      <Text style={styles.state}>State: {state}</Text>
      <Text style={styles.state}>Sets Completed: {sets.length}</Text>

      {/* List of Completed Sets */}
      <FlatList
        style={{ marginTop: 20, width: "100%" }}
        data={sets}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.setText}>
            Set {index + 1}: {formatTime(item.duration)}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  currentSet: {
    color: "#00FF00",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timer: {
    fontSize: 60,
    color: "white",
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: "row",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#FF6B00",
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginHorizontal: 10,
    borderRadius: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  state: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  setText: {
    color: "#FFD700",
    fontSize: 18,
    marginTop: 5,
    textAlign: "center",
  },
});
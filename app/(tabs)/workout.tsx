import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { useHoldTimer } from "../../timers/useHoldTimer";

export default function Workout() {
  const { elapsed, state, start, pause, stop, reset } = useHoldTimer();

  // format seconds into mm:ss
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hold Timer</Text>
      <Text style={styles.timer}>{formatTime(elapsed)}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={start}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pause}>
          <Text style={styles.buttonText}>Pause</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={stop}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={reset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.state}>State: {state}</Text>
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
    marginBottom: 20,
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
    marginTop: 20,
    fontSize: 16,
  },
});
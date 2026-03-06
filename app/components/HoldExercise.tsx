// app/components/HoldExercise.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

interface HoldExerciseProps {
  exerciseName: string;
  totalSets: number;
  elapsed: number;
  duration: number; // target duration
  sets: { durationSeconds: number }[];
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
}

export const HoldExercise: React.FC<HoldExerciseProps> = ({
  exerciseName,
  totalSets,
  elapsed,
  duration,
  sets,
  start,
  pause,
  stop,
  reset,
}) => {
  const remaining = Math.max(duration - elapsed, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseName}</Text>
      <Text style={styles.currentSet}>
        Set {sets.length + 1} / {totalSets}
      </Text>

      <Text style={styles.timer}>{remaining}s</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={start}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pause}>
          <Text style={styles.buttonText}>Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={stop}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={reset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

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
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 15,
  },
  button: {
    margin: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  setText: { color: "#FFD700", fontSize: 18, marginTop: 5 },
});

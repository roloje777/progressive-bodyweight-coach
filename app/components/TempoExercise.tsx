import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

interface TempoExerciseProps {
  exerciseName: string;
  totalSets: number;
}

export const TempoExercise: React.FC<TempoExerciseProps> = ({
  exerciseName,
  totalSets,
}) => {
  const [sets, setSets] = useState<{ completed: boolean }[]>([]);

  const completeSet = () => {
    if (sets.length >= totalSets) return;

    setSets([...sets, { completed: true }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseName}</Text>

      <Text style={styles.currentSet}>
        Set {sets.length + 1} / {totalSets}
      </Text>

      <TouchableOpacity style={styles.button} onPress={completeSet}>
        <Text style={styles.buttonText}>Finish Tempo Set</Text>
      </TouchableOpacity>

      <FlatList
        data={sets}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ index }) => (
          <Text style={styles.setText}>Set {index + 1}: completed</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 10 },
  currentSet: { fontSize: 20, color: "#00FF00", marginVertical: 5 },
  button: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  setText: { color: "#FFD700", fontSize: 18, marginTop: 5 },
});

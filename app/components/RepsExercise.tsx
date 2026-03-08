import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Keyboard,
} from "react-native";

interface RepsExerciseProps {
  exerciseName: string;
  totalSets: number;
  sets: { reps: number }[];
  minReps: number;
  maxReps: number;
  onCompleteSet: (reps: number) => void;
}

export const RepsExercise: React.FC<RepsExerciseProps> = ({
  exerciseName,
  totalSets,
  sets,
  minReps,
  maxReps,
  onCompleteSet,
}) => {
  const [repsInput, setRepsInput] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Auto-focus input when a new set appears
  useEffect(() => {
    inputRef.current?.focus();
  }, [sets.length]);

  const handleComplete = () => {
    const reps = parseInt(repsInput);

    if (isNaN(reps)) return;

    onCompleteSet(reps);

    setRepsInput("");
    Keyboard.dismiss(); // hide keyboard after submission
  };

  const isInputValid = () => {
    const reps = parseInt(repsInput);
    return !isNaN(reps) && reps >= minReps && reps <= maxReps;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseName}</Text>

      <Text style={styles.currentSet}>
        Set {sets.length + 1} / {totalSets}
      </Text>

      <Text style={styles.target}>
        Target: {minReps} - {maxReps}
      </Text>

      <TextInput
        ref={inputRef}
        style={styles.input}
        keyboardType="numeric"
        placeholder={`${minReps} - ${maxReps}`}
        placeholderTextColor="#777"
        value={repsInput}
        onChangeText={setRepsInput}
        onSubmitEditing={handleComplete} // press Done on keyboard
        returnKeyType="done"
      />

      <TouchableOpacity
        style={[styles.button, !isInputValid() && { opacity: 0.5 }]}
        disabled={!isInputValid()}
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>Complete Set</Text>
      </TouchableOpacity>

      <FlatList
        data={sets}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.setText}>
            Set {index + 1}: {item.reps} reps
          </Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 20 },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },

  currentSet: {
    fontSize: 20,
    color: "#00FF00",
    marginVertical: 5,
  },

  target: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 10,
  },

  input: {
    width: 120,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 10,
    padding: 10,
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },

  button: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  setText: {
    color: "#FFD700",
    fontSize: 18,
    marginTop: 5,
  },
});
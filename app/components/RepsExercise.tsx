import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
} from "react-native";
import { appStyles as styles } from "../styles/appStyles";

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

  const parseReps = () => {
    const reps = parseInt(repsInput.trim(), 10);
    return isNaN(reps) ? null : reps;
  };

  const isInputValid = () => {
    return parseReps() !== null;
  };

  const handleComplete = () => {
    const reps = parseReps();
    if (reps === null) return;

    onCompleteSet(reps);

    setRepsInput("");
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      
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
        onSubmitEditing={handleComplete}
        returnKeyType="done"
      />

      <TouchableOpacity
        style={[
          styles.button,
          !isInputValid() && styles.disabledButton
        ]}
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
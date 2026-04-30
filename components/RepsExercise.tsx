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

  sets: { reps: number | { left: number; right: number } }[];

  minReps: number;
  maxReps: number;

  sideMode?: "none" | "alternating";

  onCompleteSet: (reps: number | { left: number; right: number }) => void;
}

export const RepsExercise: React.FC<RepsExerciseProps> = ({
  exerciseName,
  totalSets,
  sets,
  minReps,
  maxReps,
  sideMode = "none", // ✅ ADD THIS
  onCompleteSet,
}) => {
  const [repsInput, setRepsInput] = useState("");
  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Auto-focus input when a new set appears
  // useEffect(() => {
  //   inputRef.current?.focus();
  // }, [sets.length]);

  const leftRef = useRef<TextInput>(null);
  const rightRef = useRef<TextInput>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      leftRef.current?.focus();
    }, 100); // ensures render is complete

    return () => clearTimeout(timeout);
  }, [sets.length]);

  const parseReps = () => {
    const reps = parseInt(repsInput.trim(), 10);
    return isNaN(reps) ? null : reps;
  };

  const isInputValid = () => {
    return parseReps() !== null;
  };

  // const handleComplete = () => {
  //   const reps = parseReps();
  //   if (reps === null) return;

  //   onCompleteSet(reps);

  //   setRepsInput("");
  //   Keyboard.dismiss();
  // };

  const handleComplete = () => {
    if (sideMode === "alternating") {
      const left = parseNumber(leftInput);
      const right = parseNumber(rightInput);

      if (left === null || right === null) return;

      onCompleteSet({ left, right });

      setLeftInput("");
      setRightInput("");
      setRightManuallyEdited(false); // ✅ reset for next set
    } else {
      const reps = parseNumber(leftInput);
      if (reps === null) return;

      onCompleteSet(reps);
      setLeftInput("");
    }

    Keyboard.dismiss();
  };

  const parseNumber = (val: string) => {
    const n = parseInt(val.trim(), 10);
    return isNaN(n) ? null : n;
  };

  const isValid = () => {
    if (sideMode === "alternating") {
      return (
        parseNumber(leftInput) !== null && parseNumber(rightInput) !== null
      );
    }
    return parseNumber(leftInput) !== null;
  };

  const [rightManuallyEdited, setRightManuallyEdited] = useState(false);

  const handleLeftChange = (val: string) => {
    setLeftInput(val);

    // ✅ Keep syncing UNTIL user edits right manually
    if (sideMode === "alternating" && !rightManuallyEdited) {
      setRightInput(val);
    }
  };

  const handleRightChange = (val: string) => {
    setRightInput(val);

    // 🚨 Mark as manually edited → stop auto-sync
    setRightManuallyEdited(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.target}>
        Target: {minReps} - {maxReps}
      </Text>

      {sideMode === "alternating" ? (
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          {/* LEFT */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#aaa", marginBottom: 4 }}>Left</Text>
            <TextInput
              ref={leftRef}
              style={[
                styles.input,
                {
                  borderColor: leftRef.current?.isFocused()
                    ? "#FFD700"
                    : "#333",
                },
              ]}
              keyboardType="number-pad"
              value={leftInput}
              onChangeText={handleLeftChange}
              returnKeyType="next"
              onSubmitEditing={() => rightRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* DIVIDER */}
          <View
            style={{ width: 1, backgroundColor: "#333", marginHorizontal: 6 }}
          />

          {/* RIGHT */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#aaa", marginBottom: 4 }}>Right</Text>
            <TextInput
              ref={rightRef}
              style={[
                styles.input,
                {
                  borderColor: rightRef.current?.isFocused()
                    ? "#FFD700"
                    : "#333",
                },
              ]}
              keyboardType="number-pad"
              value={rightInput}
              onChangeText={handleRightChange}
            />
          </View>
        </View>
      ) : (
        <TextInput
          ref={leftRef}
          style={styles.input}
          placeholder={`${minReps} - ${maxReps}`}
          keyboardType="number-pad"
          value={leftInput}
          onChangeText={handleLeftChange}
        />
      )}

      <TouchableOpacity
        style={[styles.button, !isValid() && styles.disabledButton]}
        disabled={!isValid()}
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>Complete Set</Text>
      </TouchableOpacity>

  
      {sets.map((item, index) => (
        <Text key={index} style={styles.setText}>
          Set {index + 1}:{" "}
          {typeof item.reps === "number"
            ? `${item.reps} reps`
            : `L:${item.reps.left} / R:${item.reps.right}`}
        </Text>
      ))}
    </View>
  );
};

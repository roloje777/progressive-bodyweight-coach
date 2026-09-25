import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import PrimaryButton from "@/components/PrimaryButton";
import { useAppStyles } from "../styles/appStyles";
import { MatchOrBeatTarget } from "../models/Exercise";

interface RepsExerciseProps {
  exerciseName: string;
  totalSets: number;

  sets: (
    | { reps: number | { left: number; right: number } }
    | { skipped: true }
  )[];

  minReps: number;
  maxReps: number;

  sideMode?: "none" | "alternating";

  matchOrBeatTargets?: MatchOrBeatTarget[];
  isBaselineWeek?: boolean;

  onCompleteSet: (reps: number | { left: number; right: number }) => void;
}

export const RepsExercise: React.FC<RepsExerciseProps> = ({
  exerciseName,
  totalSets,
  sets,
  minReps,
  maxReps,
  sideMode = "none",
  matchOrBeatTargets = [],
  isBaselineWeek = false,
  onCompleteSet,
}) => {
  const styles = useAppStyles();
  const currentSetNumber = sets.length + 1;

  const currentTarget = matchOrBeatTargets.find(
    (t) => t.setNumber === currentSetNumber,
  );

  const defaultReps = Math.max(
    0,
    Math.round(currentTarget?.target ?? (minReps + maxReps) / 2),
  );

  const [leftReps, setLeftReps] = useState(defaultReps);
  const [rightReps, setRightReps] = useState(defaultReps);
  const [rightManuallyEdited, setRightManuallyEdited] = useState(false);

  // Pre-populate each new set from the MB target when available. If there is
  // no MB target, use the midpoint of the configured rep range.
  useEffect(() => {
    setLeftReps(defaultReps);
    setRightReps(defaultReps);
    setRightManuallyEdited(false);
  }, [sets.length, currentTarget?.target, minReps, maxReps]);

  const adjustLeft = (delta: number) => {
    setLeftReps((current) => {
      const next = Math.max(0, current + delta);

      // Keep both sides in sync until the right side is adjusted manually.
      if (sideMode === "alternating" && !rightManuallyEdited) {
        setRightReps(next);
      }

      return next;
    });
  };

  const adjustRight = (delta: number) => {
    setRightManuallyEdited(true);
    setRightReps((current) => Math.max(0, current + delta));
  };

  const handleComplete = () => {
    if (sideMode === "alternating") {
      onCompleteSet({ left: leftReps, right: rightReps });
    } else {
      onCompleteSet(leftReps);
    }
  };

  const NumberStepper = ({
    value,
    onDecrease,
    onIncrease,
    label,
  }: {
    value: number;
    onDecrease: () => void;
    onIncrease: () => void;
    label?: string;
  }) => (
    <View style={{ alignItems: "center" }}>
      {label && (
        <Text style={{ color: "#aaa", marginBottom: 8 }}>{label}</Text>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label ?? "reps"}`}
          disabled={value <= 0}
          onPress={onDecrease}
          style={({ pressed }) => ({
            minWidth: 56,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#FFD700",
            borderRadius: 8,
            opacity: value <= 0 ? 0.35 : pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ color: "#FFD700", fontSize: 28 }}>−</Text>
        </Pressable>

        <View
          style={{
            minWidth: 90,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <Text
            style={{ color: "#FFD700", fontSize: 30, fontWeight: "bold" }}
          >
            {value}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label ?? "reps"}`}
          onPress={onIncrease}
          style={({ pressed }) => ({
            minWidth: 56,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#FFD700",
            borderRadius: 8,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ color: "#FFD700", fontSize: 28 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.target}>
        Target: {minReps} - {maxReps}
      </Text>
      {currentTarget ? (
        <Text style={{ color: "#FFD700", fontSize: 16, marginBottom: 10, fontWeight: "bold" }}>
          Match or Beat: {currentTarget.target}
        </Text>
      ) : isBaselineWeek ? (
        <Text style={{ color: "#FFD700", fontSize: 16, marginBottom: 10, fontWeight: "bold", textAlign: "center" }}>
          Set Your Baseline: Give your best controlled effort — this result will set your future Match or Beat target.
        </Text>
      ) : null}

      {sideMode === "alternating" ? (
        <View
          style={{
            width: "100%",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <NumberStepper
            label="Left"
            value={leftReps}
            onDecrease={() => adjustLeft(-1)}
            onIncrease={() => adjustLeft(1)}
          />
          <NumberStepper
            label="Right"
            value={rightReps}
            onDecrease={() => adjustRight(-1)}
            onIncrease={() => adjustRight(1)}
          />
        </View>
      ) : (
        <View style={{ marginBottom: 12 }}>
          <NumberStepper
            value={leftReps}
            onDecrease={() => adjustLeft(-1)}
            onIncrease={() => adjustLeft(1)}
          />
        </View>
      )}

      <PrimaryButton title="Complete Set" onPress={handleComplete} />

      <View style={{ alignItems: "center", marginTop: 10 }}>
        {sets.map((item, index) => (
          <Text key={index} style={styles.setText}>
            {"skipped" in item ? (
              <>Set {index + 1}: ⏭ Skipped</>
            ) : (
              <>
                Set {index + 1}:{" "}
                {typeof item.reps === "number"
                  ? `${item.reps} reps`
                  : `L:${item.reps.left} / R:${item.reps.right}`}
              </>
            )}
          </Text>
        ))}
      </View>
    </View>
  );
};

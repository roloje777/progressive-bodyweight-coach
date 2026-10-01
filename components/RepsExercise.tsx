import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import PrimaryButton from "@/components/PrimaryButton";
import { MatchOrBeatHint } from "@/components/MatchOrBeatHint";
import { useAppStyles } from "../styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { MatchOrBeatTarget } from "../models/Exercise";
import { useTranslation } from "@/hooks/useTranslation";

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
  const palette = useAppPalette();
  const { t } = useTranslation();
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
        <Text style={{ color: palette.textMuted, marginBottom: 8 }}>
          {label}
        </Text>
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
            borderColor: palette.primary,
            borderRadius: 8,
            opacity: value <= 0 ? 0.35 : pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ color: palette.primary, fontSize: 28 }}>−</Text>
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
            style={{ color: palette.primary, fontSize: 30, fontWeight: "bold" }}
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
            borderColor: palette.primary,
            borderRadius: 8,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ color: palette.primary, fontSize: 28 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.target}>
        {t("workout.targetReps", { min: minReps, max: maxReps })}
      </Text>
      {currentTarget ? (
        <Text
          style={{
            color: palette.primary,
            fontSize: 16,
            marginBottom: 10,
            fontWeight: "bold",
          }}
        >
          {currentTarget.target != null &&
            t("exercise.matchOrBeat", { target: currentTarget.target })}
        </Text>
      ) : isBaselineWeek ? (
        <Text
          style={{
            color: palette.primary,
            fontSize: 16,
            marginBottom: 10,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {t("exercise.baselinePrompt")}
        </Text>
      ) : null}
      {currentTarget ? <MatchOrBeatHint /> : null}

      {sideMode === "alternating" ? (
        <View
          style={{
            width: "100%",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <NumberStepper
            label={t("common.left")}
            value={leftReps}
            onDecrease={() => adjustLeft(-1)}
            onIncrease={() => adjustLeft(1)}
          />
          <NumberStepper
            label={t("common.right")}
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

      <PrimaryButton
        title={t("exercise.completeSet")}
        onPress={handleComplete}
      />

      <View style={{ alignItems: "center", marginTop: 10 }}>
        {sets.map((item, index) => (
          <Text key={index} style={styles.setText}>
            {"skipped" in item ? (
              <>
                {t("exercise.setLine", {
                  set: index + 1,
                  value: t("exercise.skipped"),
                })}
              </>
            ) : (
              <>
                {t("exercise.setLine", {
                  set: index + 1,
                  value:
                    typeof item.reps === "number"
                      ? `${item.reps} ${t("unit.reps")}`
                      : `L:${item.reps.left} / R:${item.reps.right}`,
                })}
              </>
            )}
          </Text>
        ))}
      </View>
    </View>
  );
};

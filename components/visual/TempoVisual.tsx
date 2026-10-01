import React from "react";
import { Text, View } from "react-native";
import { TempoPhase } from "../TempoExercise";
import { useAppStyles } from "@/styles/appStyles";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  phase: TempoPhase;
  targetReached?: boolean;
}

export const TempoVisual: React.FC<Props> = ({ phase, targetReached = false }) => {
  const styles = useAppStyles();
  const { t } = useTranslation();
  const label = phaseLabel(phase, t);
  const arrow = phaseArrow(phase);

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 20,
      }}
    >
      <Text style={styles.tempoArrow}>{arrow}</Text>

      <Text style={targetReached ? styles.holdLabel : styles.tempoLabel}>
        {targetReached ? t("workout.tempo.targetReached") : label}
      </Text>
    </View>
  );
};

function phaseLabel(phase: TempoPhase, t: ReturnType<typeof useTranslation>["t"]) {
  switch (phase) {
    case "eccentric":
      return t("workout.tempo.lower");
    case "concentric":
      return t("workout.tempo.raise");
    case "pauseEccentric":
      return t("workout.tempo.hold");
    case "pauseConcentric":
      return t("workout.tempo.lock");
  }
}

function phaseArrow(phase: TempoPhase) {
  switch (phase) {
    case "eccentric":
      return "↓";
    case "concentric":
      return "↑";
    case "pauseEccentric":
      return "⏸";
    case "pauseConcentric":
      return "⏸";
  }
}

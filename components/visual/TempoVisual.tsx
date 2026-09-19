import React from "react";
import { Text, View } from "react-native";
import { TempoPhase } from "../TempoExercise";
import { appStyles as styles } from "@/styles/appStyles";

interface Props {
  phase: TempoPhase;
  targetReached?: boolean;
}

export const TempoVisual: React.FC<Props> = ({ phase, targetReached = false }) => {
  const label = phaseLabel(phase);
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
        {targetReached ? "TARGET REACHED" : label}
      </Text>
    </View>
  );
};

function phaseLabel(phase: TempoPhase) {
  switch (phase) {
    case "eccentric":
      return "LOWER";
    case "concentric":
      return "RAISE";
    case "pauseEccentric":
      return "HOLD";
    case "pauseConcentric":
      return "LOCK";
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

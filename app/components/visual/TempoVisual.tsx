import React from "react";
import { Text, View } from "react-native";
import { TempoPhase } from "../TempoExercise";

interface Props {
  phase: TempoPhase;
}

export const TempoVisual: React.FC<Props> = ({ phase }) => {
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
      <Text style={{ fontSize: 80 }}>{arrow}</Text>

      <Text
        style={{
          fontSize: 26,
          fontWeight: "bold",
          color: "white",
          marginTop: 10,
        }}
      >
        {label}
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

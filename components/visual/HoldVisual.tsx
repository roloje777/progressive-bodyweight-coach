//components/visual/HoldVisual.tsx
import React from "react";
import { Text, View } from "react-native";
import { appStyles as styles } from "../../styles/appStyles";

interface HoldVisualProps {
  elapsed: number;
  duration: number;
}

export const HoldVisual: React.FC<HoldVisualProps> = ({
  elapsed,
  duration,
}) => {
  const targetProgress =
    duration > 0
      ? Math.min(elapsed / duration, 1)
      : 0;

  const overtime = Math.max(elapsed - duration, 0);

  const overtimeProgress =
    duration > 0
      ? Math.min(overtime / duration, 1)
      : 0;

  const targetReached = elapsed >= duration;

  return (
    <View style={styles.visualContainer}>
      <Text style={styles.holdLabel}>
        {targetReached ? "TARGET REACHED" : "HOLD"}
      </Text>

      <Text
        style={[
          styles.bigTimer,
          targetReached && {
            color: "#4CAF50",
          },
        ]}
      >
        {elapsed}
      </Text>

      <Text style={styles.secondsLabel}>
        {targetReached
          ? `+${overtime}s beyond target`
          : `Target: ${duration}s`}
      </Text>

      {/* Target progress */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${targetProgress * 100}%`,
            },
          ]}
        />
      </View>

      {/* Overtime progress */}
      {targetReached && (
        <View
          style={[
            styles.progressBarBackground,
            {
              marginTop: 8,
            },
          ]}
        >
          <View
            style={[
              styles.progressBarOvertime,
              {
                width: `${overtimeProgress * 100}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};
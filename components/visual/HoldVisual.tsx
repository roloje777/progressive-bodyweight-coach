import React from "react";
import { Text, View } from "react-native";
import { appStyles as styles } from "../../styles/appStyles";

interface HoldVisualProps {
  remaining: number;
  duration: number;
}

export const HoldVisual: React.FC<HoldVisualProps> = ({
  remaining,
  duration,
}) => {
  const progress = duration > 0 ? remaining / duration : 0;

  return (
    <View style={styles.visualContainer}>
      <Text style={styles.holdLabel}>HOLD</Text>

      <Text style={styles.bigTimer}>{remaining}</Text>

      <Text style={styles.secondsLabel}>seconds</Text>

      <View style={styles.progressBarBackground}>
        <View
          style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  );
};

import { View, Text } from "react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { topAppBarStyles as styles } from "../styles/components/topAppBarStyles";

type IconName = keyof typeof Ionicons.glyphMap;

function getLevel(value: number): {
  label: string;
  icon: IconName;
} {
  if (value <= 1.5) return { label: "Very Low", icon: "leaf" };
  if (value <= 2.5) return { label: "Low", icon: "arrow-down" };
  if (value <= 3.5) return { label: "Moderate", icon: "remove" };
  if (value <= 4.5) return { label: "High", icon: "arrow-up" };
  return { label: "Extreme", icon: "flame" };
}
function getColor(value: number) {
  if (value <= 1.5) return "#4CAF50"; // green
  if (value <= 2.5) return "#8BC34A"; // light green
  if (value <= 3.5) return "#FFC107"; // yellow
  if (value <= 4.5) return "#FF9800"; // orange
  return "#FF3B30"; // red
}

type StatPillProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
};

const StatPill = ({ icon, label, value }: StatPillProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const level = getLevel(value);
  const color = getColor(value);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value / 5,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const widthInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.pill}>
      <View style={styles.row}>
        <Ionicons name={level.icon} size={16} color={color} />
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
      <Text style={styles.level}>{level.label}</Text>

      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthInterpolate,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

type TopAppBarProps = {
  effectiveness: number;
  difficulty: number;
};

export default function TopAppBar({
  effectiveness,
  difficulty,
}: TopAppBarProps) {
  return (
    <View style={styles.container}>
      <StatPill icon="flame" label="Hypertrophy" value={effectiveness} />
      <StatPill icon="flash" label="Difficulty" value={difficulty} />
    </View>
  );
}

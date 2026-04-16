import { View, Text } from "react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { topAppBarStyles as styles } from "../styles/components/topAppBarStyles";
import { getHypertrophyLevel } from "@/utils/hypertrophyTheme";





type StatPillProps = {
  icon: keyof typeof Ionicons.glyphMap; // metric icon
  label: string;
  value: number;
};

const StatPill = ({ icon, label, value }: StatPillProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // const level = getLevel(value);
  // const color = getColor(value);

  const {
    label: levelLabel,
    color,
    icon: levelIcon, // 👈 rename
  } = getHypertrophyLevel(value);

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
      {/* TOP ROW: metric identity */}
      <View style={styles.row}>
        <Ionicons name={icon} size={14} color="#aaa" />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>

      {/* SECOND ROW: level */}
      <View style={styles.row}>
        <Ionicons name={levelIcon} size={16} color={color} />
        <Text style={[styles.levelLabel, { color }]}>{levelLabel}</Text>
      </View>

      {/* BAR */}
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

import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { appStyles as styles } from "@/styles/appStyles";
import { useRouter } from "expo-router";
import {
  calculateHypertrophyPercentage,
  calculateHypertrophyUnit,
} from "@/utils/calculateHypertrophy";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { getHypertrophyLevel } from "@/utils/hypertrophyTheme";
import { Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  effectiveness: number; // 0–5
  difficulty: number; // 0–5
  daysLeft: number;
  week: number;
  day: number;
  totalDays: number;
  title: string;
  description: string;
};

const radius = 45;
const strokeWidth = 6;

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}

// function describeArc(
//   x: number,
//   y: number,
//   r: number,
//   startAngle: number,
//   endAngle: number,
// ) {
//   const start = polarToCartesian(x, y, r, startAngle);
//   const end = polarToCartesian(x, y, r, endAngle);

//   const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

//   return `
//     M ${start.x} ${start.y}
//     A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
//   `;
// }

export default function TopProgressBar({
  effectiveness,
  difficulty,
  daysLeft,
  week,
  day,
  totalDays,
  title,
  description,
}: Props) {
  const size = 110;
  const center = size / 2;

  console.log(
    `%c 📊 PROPS MONITOR: ${title} `,
    "background: #222; color: #00FFAA; font-weight: bold; padding: 2px 4px; border-radius: 4px;",
  );

  console.table({
    Title: title,
    "Effectiveness (0-5)": effectiveness,
    "Eff % (for SVG)": (effectiveness / 5).toFixed(2),
    "Difficulty (0-5)": difficulty,
    Timeline: `${day}/${totalDays} (Week ${week})`,
    "Days Left": daysLeft,
  });

  // Optional: Log the description separately if it's long
  console.log(`Description: ${description}`);

  const effRadius = radius;
  const diffRadius = radius - 20;

  const effCircumference = 2 * Math.PI * effRadius;
  //   const diffCircumference = 2 * Math.PI * diffRadius;

  const hypertrophyValue = calculateHypertrophyPercentage(
    effectiveness,
    difficulty,
  ); //hypertrophy values calculated and effectiveness + difficulty
  const hypertrophyUnit = calculateHypertrophyUnit(effectiveness, difficulty);

  console.log("---- hypertrophyValue ----", hypertrophyValue);

  const { color } = getHypertrophyLevel(hypertrophyUnit);

  const router = useRouter();

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(hypertrophyValue, { duration: 800 });
  }, [hypertrophyValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: effCircumference * (1 - progress.value),
  }));

  return (
    <View style={styles.topBarContainer}>
      {/* Title */}
      {/* <Text style={styles.topBarTitle}>{title}</Text> */}
      <Pressable
        onLongPress={() => {
          if (__DEV__) router.push("/screens/tests/debugProgress");
        }}
        onPress={() => {
          if (__DEV__ && Platform.OS === "web") {
            router.push("/screens/tests/debugProgress");
          }
        }}
      >
        <Text style={styles.topBarTitle}>{title}</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/screens/hypertrophyDetails")}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#FF3B30" />
                <Stop offset="50%" stopColor="#FFC107" />
                <Stop offset="100%" stopColor="#4CAF50" />
              </LinearGradient>
            </Defs>

            <Circle
              cx={center}
              cy={center}
              r={effRadius}
              stroke="#2A2A2A"
              strokeWidth={strokeWidth}
              fill="none"
            />

            <AnimatedCircle
              cx={center}
              cy={center}
              r={effRadius}
              stroke="url(#grad)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${effCircumference}`}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${center}, ${center}`}
            />

            {/* Difficulty */}
            {/* <Circle
            cx={center}
            cy={center}
            r={diffRadius}
            stroke="#FFD700"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${diffCircumference}`}
            strokeDashoffset={diffCircumference * (1 - difficulty/5)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${center}, ${center}`}
          /> */}
          </Svg>

          <View
            style={{
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color, fontSize: 18, fontWeight: "bold" }}>
              {Math.round(hypertrophyUnit)}
            </Text>
            <Text style={{ color, fontSize: 12 }}>Hypertrophy</Text>
          </View>
        </View>
      </Pressable>

      {/* Description */}
      <Text style={styles.topBarDescription}>{description}</Text>
      <Text style={styles.weekDayText}>
        Week {week + 1} • Day {day + 1}
      </Text>
    </View>
  );
}

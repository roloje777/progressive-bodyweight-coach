import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { appStyles as styles } from "@/styles/appStyles";
import { useRouter } from "expo-router";
import {
  calculateHypertrophyUnitV2,
  calculateHypertrophyProgress,
} from "@/utils/hypertrophy/calculateHypertrophyV2";
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
 const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}


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

  const avgSets = 4; // placeholder (or compute later)
const avgReps = 12;
const daysPerWeek = 4; // program.days.length
const weeks = 4;

  // Optional: Log the description separately if it's long
  console.log(`Description: ${description}`);

  const effRadius = radius;
  const diffRadius = radius - 20;

  const effCircumference = 2 * Math.PI * effRadius;
  //   const diffCircumference = 2 * Math.PI * diffRadius;




  const router = useRouter();

 

  // 1. Build hypertrophy max (0–5)
const hypertrophyMax = calculateHypertrophyUnitV2({
  effectiveness,
  difficulty,
  avgSets,
  avgReps,
  daysPerWeek,
  weeks,
});

// 2. Convert into progress based on program completion
const { percentage, unit } = calculateHypertrophyProgress({
  hypertrophyMax,
  currentDay: day + 1,
  totalDays,
});


  console.log("---- hypertrophyValue ----",unit);

 const { color } = getHypertrophyLevel(unit);

// 3. Animated value (NOW uses percentage, not raw hypertrophy)
const progress = useSharedValue(0);

React.useEffect(() => {
  progress.value = withTiming(percentage, { duration: 800 });
}, [percentage]);
 
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
             {Math.round(unit)}
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

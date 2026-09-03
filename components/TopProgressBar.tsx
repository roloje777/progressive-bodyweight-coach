//components/TopProgressBar.tsx
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Href, useRouter } from "expo-router";

import { appStyles as styles } from "@/styles/appStyles";
import {
  calculateHypertrophyProgress,
  calculateHypertrophyUnitV2,
} from "@/utils/hypertrophy/calculateHypertrophyV2";
import { getHypertrophyLevel } from "@/utils/hypertrophyTheme";

type Props = {
  effectiveness: number;
  difficulty: number;

  avgSets: number;
  avgReps: number;
  daysPerWeek: number;
  weeks: number;

  daysLeft: number;
  week: number;
  day: number;
  totalDays: number;
  title: string;
  description: string;
  recoveryMode?: boolean;
};

const radius = 45;
const strokeWidth = 6;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TopProgressBar(props: Props) {
  if (props.recoveryMode) {
    return <RecoveryProgressBar {...props} />;
  }

  return <NormalProgressBar {...props} />;
}

/**
 * Recovery progress header.
 *
 * This is intentionally a separate component so that the normal
 * progress-bar hooks are never conditionally executed.
 */
function RecoveryProgressBar({ day }: Props) {
  return (
    <View
      style={[
        styles.topBarContainer,
        {
          paddingHorizontal: 24,
          backgroundColor: "#0E1D22",
          borderBottomWidth: 1,
          borderBottomColor: "#234B57",
        },
      ]}
    >
      <Text
        style={[
          styles.topBarTitle,
          {
            color: "#B3E5FC",
            fontSize: 22,
          },
        ]}
      >
        Recovery
      </Text>

      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 56,
          borderWidth: 6,
          borderColor: "#4FC3F7",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#102A33",
          marginVertical: 6,
        }}
      >
        <Text style={{ fontSize: 36 }}>🛡️</Text>

        <Text
          style={{
            color: "#B3E5FC",
            fontWeight: "700",
            marginTop: 2,
          }}
        >
          RECOVER
        </Text>
      </View>

      <Text
        style={[
          styles.topBarDescription,
          {
            color: "#D4EAF0",
            textAlign: "center",
            lineHeight: 19,
          },
        ]}
      >
        Strength work is paused while you recover. Keep activity comfortable
        and give your body time to settle before verification training.
      </Text>

      <Text
        style={[
          styles.weekDayText,
          {
            color: "#81D4FA",
          },
        ]}
      >
        Recovery Day {day + 1}
      </Text>
    </View>
  );
}

/**
 * Normal hypertrophy progress header.
 */
function NormalProgressBar({
  effectiveness,
  difficulty,
  avgSets,
  avgReps,
  daysPerWeek,
  weeks,
  daysLeft,
  week,
  day,
  totalDays,
  title,
  description,
}: Props) {
  const router = useRouter();

  const progress = useSharedValue(0);

  const size = 110;
  const center = size / 2;

  const effRadius = radius;
  const effCircumference = 2 * Math.PI * effRadius;

  // 1. Build hypertrophy maximum.
  const hypertrophyMax = calculateHypertrophyUnitV2({
    effectiveness,
    difficulty,
    avgSets,
    avgReps,
    daysPerWeek,
    weeks,
  });

  // 2. Convert maximum into current program progress.
  const { percentage, unit } = calculateHypertrophyProgress({
    hypertrophyMax,
    currentDay: day + 1,
    totalDays,
  });

  const { color } = getHypertrophyLevel(unit);

  // 3. Animate current progress percentage.
  React.useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 800,
    });
  }, [percentage, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      effCircumference * (1 - progress.value),
  }));

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

  console.log(`Description: ${description}`);
  console.log("---- hypertrophyValue ----", unit);

  return (
    <View style={styles.topBarContainer}>
      <Pressable
        onLongPress={() => {
          if (__DEV__) {
            router.push("/screens/tests/CoachingScenarioTest");
          }
        }}
        onPress={() => {
          if (__DEV__ && Platform.OS === "web") {
            router.push("/screens/tests/CoachingScenarioTest");
          }
        }}
      >
        <Text style={styles.topBarTitle}>
          {title}
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          router.push(
            "/screens/hypertrophyDetails" as Href,
          )
        }
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg
            width={size}
            height={size}
          >
            <Defs>
              <LinearGradient
                id="grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop
                  offset="0%"
                  stopColor="#FF3B30"
                />

                <Stop
                  offset="50%"
                  stopColor="#FFC107"
                />

                <Stop
                  offset="100%"
                  stopColor="#4CAF50"
                />
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
              strokeDasharray={effCircumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>

          <View
            style={{
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color,
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {Math.round(unit)}
            </Text>

            <Text
              style={{
                color,
                fontSize: 12,
              }}
            >
              Hypertrophy
            </Text>
          </View>
        </View>
      </Pressable>

      <Text style={styles.topBarDescription}>
        {description}
      </Text>

      <Text style={styles.weekDayText}>
        Week {week + 1} • Day {day + 1}
      </Text>
    </View>
  );
}
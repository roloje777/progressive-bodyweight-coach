// components/TopProgressBar.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Href, useRouter } from "expo-router";

import { appStyles as styles } from "@/styles/appStyles";

type CoachState =
  | "graduation-ready"
  | "sustainable-progress"
  | "progress-with-recovery-strain"
  | "recovery-priority"
  | "consistency-priority"
  | "performance-plateau"
  | "steady-progress"
  | "building-evidence";

type AnalyticsTrend =
  | "improving"
  | "stable"
  | "declining"
  | "insufficient-data";

type Props = {
  week: number;
  day: number;
  title: string;
  description: string;
  recoveryMode?: boolean;

  workoutsCompleted: number;
  workoutsExpected: number;
  coachState?: CoachState;
  coachHeadline?: string;
  matchOrBeatTrend?: AnalyticsTrend;
  recoveryTrend?: AnalyticsTrend;
  adherenceRate?: number | null;
};

const radius = 47;
const strokeWidth = 7;
const size = 118;
const center = size / 2;
const circumference = 2 * Math.PI * radius;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STATE_PRESENTATION: Record<
  CoachState,
  { label: string; color: string }
> = {
  "graduation-ready": { label: "READY", color: "#4CAF50" },
  "sustainable-progress": { label: "PROGRESSING", color: "#4CAF50" },
  "progress-with-recovery-strain": { label: "CAUTION", color: "#FFC107" },
  "recovery-priority": { label: "RECOVER", color: "#4FC3F7" },
  "consistency-priority": { label: "BUILD RHYTHM", color: "#FFD700" },
  "performance-plateau": { label: "PLATEAU", color: "#FFC107" },
  "steady-progress": { label: "ON TRACK", color: "#FFD700" },
  "building-evidence": { label: "BUILDING", color: "#AAAAAA" },
};

const TREND_PRESENTATION: Record<
  AnalyticsTrend,
  { symbol: string; label: string; color: string }
> = {
  improving: { symbol: "↑", label: "Improving", color: "#4CAF50" },
  stable: { symbol: "→", label: "Stable", color: "#FFD700" },
  declining: { symbol: "↓", label: "Needs attention", color: "#FF8A65" },
  "insufficient-data": { symbol: "·", label: "Building", color: "#888888" },
};

export default function TopProgressBar(props: Props) {
  if (props.recoveryMode) {
    return <RecoveryProgressBar {...props} />;
  }

  return <TrainingStatusHeader {...props} />;
}

function navigateToAnalytics(router: ReturnType<typeof useRouter>) {
  router.push("/(tabs)/analytics" as Href);
}

function RecoveryProgressBar({ day }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => navigateToAnalytics(router)}
      onLongPress={() => {
        if (__DEV__) {
          router.push("/screens/tests/CoachingScenarioTest" as Href);
        }
      }}
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
      <Text style={[styles.topBarTitle, { color: "#B3E5FC", fontSize: 22 }]}>
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
        <Text style={{ color: "#B3E5FC", fontWeight: "700", marginTop: 2 }}>
          RECOVER
        </Text>
      </View>

      <Text
        style={[
          styles.topBarDescription,
          { color: "#D4EAF0", textAlign: "center", lineHeight: 19 },
        ]}
      >
        Strength work is paused while you recover. Keep activity comfortable
        and give your body time to settle before verification training.
      </Text>

      <Text style={[styles.weekDayText, { color: "#81D4FA" }]}>
        Recovery Day {day + 1}
      </Text>
      <Text style={styles.topBarAnalyticsLink}>View Progress ›</Text>
    </Pressable>
  );
}

function TrainingStatusHeader({
  week,
  day,
  title,
  description,
  workoutsCompleted,
  workoutsExpected,
  coachState = "building-evidence",
  coachHeadline,
  matchOrBeatTrend = "insufficient-data",
  recoveryTrend = "insufficient-data",
  adherenceRate,
}: Props) {
  const router = useRouter();
  const progress = useSharedValue(0);

  const completion =
    workoutsExpected > 0
      ? Math.min(1, Math.max(0, workoutsCompleted / workoutsExpected))
      : 0;
  const completionPercent = Math.round(completion * 100);
  const statePresentation = STATE_PRESENTATION[coachState];
  const mbPresentation = TREND_PRESENTATION[matchOrBeatTrend];
  const recoveryPresentation = TREND_PRESENTATION[recoveryTrend];

  React.useEffect(() => {
    progress.value = withTiming(completion, { duration: 700 });
  }, [completion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Pressable
      onPress={() => navigateToAnalytics(router)}
      onLongPress={() => {
        if (__DEV__) {
          router.push("/screens/tests/CoachingScenarioTest" as Href);
        }
      }}
      style={styles.topBarContainer}
      accessibilityRole="button"
      accessibilityLabel="Open progress analytics"
    >
      <Text style={styles.topBarEyebrow}>CURRENT PROGRAM</Text>
      <Text style={styles.topBarTitle}>{title}</Text>

      <View style={styles.topBarStatusRingContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#2A2A2A"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={statePresentation.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        <View style={styles.topBarStatusRingCenter}>
          <Text
            style={[
              styles.topBarStateLabel,
              { color: statePresentation.color },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {statePresentation.label}
          </Text>
          <Text style={styles.topBarProgressPercent}>{completionPercent}%</Text>
          <Text style={styles.topBarProgressCaption}>this week</Text>
        </View>
      </View>

      <Text style={styles.topBarCoachHeadline} numberOfLines={2}>
        {coachHeadline || description}
      </Text>

      <View style={styles.topBarEvidenceRow}>
        <View style={styles.topBarEvidenceItem}>
          <Text style={styles.topBarEvidenceLabel}>MATCH OR BEAT</Text>
          <Text style={[styles.topBarEvidenceValue, { color: mbPresentation.color }]}>
            {mbPresentation.symbol} {mbPresentation.label}
          </Text>
        </View>

        <View style={styles.topBarEvidenceDivider} />

        <View style={styles.topBarEvidenceItem}>
          <Text style={styles.topBarEvidenceLabel}>RECOVERY</Text>
          <Text
            style={[
              styles.topBarEvidenceValue,
              { color: recoveryPresentation.color },
            ]}
          >
            {recoveryPresentation.symbol} {recoveryPresentation.label}
          </Text>
        </View>
      </View>

      <Text style={styles.weekDayText}>
        Week {week + 1} • Day {day + 1} • {workoutsCompleted}/{workoutsExpected} workouts
      </Text>

      {adherenceRate != null && (
        <Text style={styles.topBarAdherenceText}>
          Recent adherence {Math.round(adherenceRate)}%
        </Text>
      )}

      <Text style={styles.topBarAnalyticsLink}>View Progress ›</Text>
    </Pressable>
  );
}

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

import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";

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
  recoveryCanTrain?: boolean;
  recoveryDaysRemaining?: number | null;
  recoveryEligibleDateLabel?: string | null;

  workoutsCompleted: number;
  workoutsExpected: number;
  coachState?: CoachState;
  coachHeadline?: string;
  matchOrBeatTrend?: AnalyticsTrend;
  recoveryTrend?: AnalyticsTrend;
  adherenceRate?: number | null;
  baselineWeek?: boolean;
  compact?: boolean;
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
  const styles = useAppStyles();
  const palette = useAppPalette();
  if (props.recoveryMode) {
    return <RecoveryProgressBar {...props} />;
  }

  return <TrainingStatusHeader {...props} />;
}

function navigateToAnalytics(router: ReturnType<typeof useRouter>) {
  router.push("/(tabs)/analytics" as Href);
}

function navigateToDevTools(router: ReturnType<typeof useRouter>) {
  if (__DEV__) {
    router.push("/screens/devTools" as Href);
  }
}

function RecoveryProgressBar({
  day,
  recoveryCanTrain,
  recoveryDaysRemaining,
  recoveryEligibleDateLabel,
}: Props) {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const router = useRouter();

  const isWaiting = recoveryCanTrain === false;
  const waitText =
    recoveryDaysRemaining === 1
      ? "1 day"
      : recoveryDaysRemaining != null
        ? `${recoveryDaysRemaining} days`
        : null;

  return (
    <Pressable
      onPress={() => navigateToAnalytics(router)}
      onLongPress={__DEV__ ? () => navigateToDevTools(router) : undefined}
      delayLongPress={700}
      style={[
        styles.topBarContainer,
        {
          paddingHorizontal: 24,
          backgroundColor: palette.surface,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.topBarTitle, { color: palette.info, fontSize: 22 }]}>
        Recovery
      </Text>

      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 56,
          borderWidth: 6,
          borderColor: palette.info,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.surfaceAlt,
          marginVertical: 6,
        }}
      >
        <Text style={{ fontSize: 36 }}>🛡️</Text>
        <Text style={{ color: palette.info, fontWeight: "700", marginTop: 2 }}>
          RECOVER
        </Text>
      </View>

      <Text
        style={{
          color: isWaiting ? palette.info : palette.accent,
          fontSize: 13,
          fontWeight: "800",
          letterSpacing: 1.1,
          marginTop: 4,
          marginBottom: 6,
        }}
      >
        {isWaiting ? "REST PERIOD" : "RECOVERY READY"}
      </Text>

      <Text
        style={[
          styles.topBarDescription,
          { color: palette.text, textAlign: "center", lineHeight: 19 },
        ]}
      >
        {isWaiting
          ? waitText
            ? `Your next recovery workout will be available in ${waitText}.`
            : "Your next recovery workout is still in its required rest period."
          : "Your next recovery workout is available now."}
      </Text>

      {isWaiting && recoveryEligibleDateLabel ? (
        <Text
          style={{
            color: palette.info,
            textAlign: "center",
            fontWeight: "700",
            marginTop: 6,
          }}
        >
          Available {recoveryEligibleDateLabel}
        </Text>
      ) : null}

      <Text
        style={{
          color: palette.textMuted,
          textAlign: "center",
          fontSize: 12,
          lineHeight: 17,
          marginTop: 7,
          paddingHorizontal: 8,
        }}
      >
        Recovery sessions are spaced apart to give your body time to settle
        before the next session.
      </Text>

      <Text style={[styles.weekDayText, { color: palette.info }]}>
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
  baselineWeek,
  compact = false,
}: Props) {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const router = useRouter();
  const progress = useSharedValue(0);

  const completion =
    workoutsExpected > 0
      ? Math.min(1, Math.max(0, workoutsCompleted / workoutsExpected))
      : 0;
  const completionPercent = Math.round(completion * 100);
  const rawStatePresentation = STATE_PRESENTATION[coachState];
  const rawMbPresentation = TREND_PRESENTATION[matchOrBeatTrend];
  const rawRecoveryPresentation = TREND_PRESENTATION[recoveryTrend];
  const resolvePresentationColor = (color: string) =>
    color === "#FFD700" ? palette.primary : color === "#AAAAAA" || color === "#888888" ? palette.textMuted : color;
  const statePresentation = { ...rawStatePresentation, color: resolvePresentationColor(rawStatePresentation.color) };
  const mbPresentation = { ...rawMbPresentation, color: resolvePresentationColor(rawMbPresentation.color) };
  const recoveryPresentation = { ...rawRecoveryPresentation, color: resolvePresentationColor(rawRecoveryPresentation.color) };

  React.useEffect(() => {
    progress.value = withTiming(completion, { duration: 700 });
  }, [completion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  if (compact) {
    return (
      <Pressable
        onPress={() => navigateToAnalytics(router)}
        onLongPress={__DEV__ ? () => navigateToDevTools(router) : undefined}
        delayLongPress={700}
        style={[
          styles.topBarContainer,
          {
            paddingVertical: 5,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open progress analytics"
      >
        <View style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: palette.text, fontWeight: "800", fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
              {title}
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 12 }} numberOfLines={1}>
              W{week + 1} • D{day + 1} • {workoutsCompleted}/{workoutsExpected}
            </Text>
          </View>
          <Text style={{ color: statePresentation.color, fontWeight: "900", fontSize: 13 }}>
            {completionPercent}% ›
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => navigateToAnalytics(router)}
      onLongPress={__DEV__ ? () => navigateToDevTools(router) : undefined}
      delayLongPress={700}
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
            stroke={palette.surfaceAlt}
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

      {baselineWeek && (
        <Text style={{ color: palette.accent, fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginBottom: 5 }}>
          WEEK 1 • ESTABLISHING YOUR BASELINE
        </Text>
      )}

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

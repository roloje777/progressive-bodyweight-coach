//app/(tabs)/index.tsx
import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  Pressable,
  Platform,
  FlatList,
  View,
  ListRenderItem,
  Animated,
  Modal,
  ScrollView,
  Text,
  LayoutAnimation,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { logWorkoutState } from "@/utils/debugWorkout";
import { useAppStyles } from "../../styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import TopProgressBar from "@/components/TopProgressBar";
import { buildSession } from "@/engine/sessionBuilder";
import { createActiveWorkout } from "@/storage/activeWorkoutStorage";
import { loadStartedProgramPosition } from "@/storage/workoutStartStorage";
import { useWorkoutRecoverySettings } from "@/hooks/useWorkoutRecoverySettings";
import { useProgress, WorkoutAccessStatus } from "@/hooks/useProgress";
import VerificationProgressHeader from "@/components/VerificationProgressHeader";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { exerciseRegistry } from "@/data/exerciseRegistry";
import { Ionicons } from "@expo/vector-icons";
import { useTrainingScheduleSettings } from "@/hooks/useTrainingScheduleSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { formatLocalizedDate } from "@/utils/localizedDate";
import {
  formatTrainingCycle,
  getTrainingCycleForPreset,
  TRAINING_CYCLE_PRESET_OPTIONS,
} from "@/data/recommendedTrainingCycles";

type HomeTimelineItem =
  | { type: "training"; dayIndex: number; title: string; phase?: "previous" | "current" }
  | { type: "rest"; slotIndex: number; phase?: "previous" | "current" }
  | { type: "week-transition"; fromWeek: number; toWeek: number };

function parseLocalDateKey(dateKey?: string): Date | null {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getRecoveryAvailabilityPresentation(nextEligibleDate: string | undefined, language: "en" | "pt-PT") {
  const eligible = parseLocalDateKey(nextEligibleDate);
  if (!eligible) {
    return { daysRemaining: null as number | null, dateLabel: null as string | null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eligible.setHours(0, 0, 0, 0);

  const daysRemaining = Math.max(
    0,
    Math.round((eligible.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
  );

  return {
    daysRemaining,
    dateLabel: formatLocalizedDate(eligible, language, { weekday: "long", month: "short", day: "numeric" }),
  };
}

// ✅ DayCard component handles individual cards + animated badge
function DayCard({
  title,
  status,
  includeWarmup,
  includeStretch,
  onPress,
  toggleWarmup,
  toggleStretch,
  progress,
  recoveryMode,
  recoveryWaitLabel,
}: {
  title: string;

  status: WorkoutAccessStatus;

  includeWarmup: boolean;
  includeStretch: boolean;

  onPress: () => void;

  toggleWarmup: () => void;
  toggleStretch: () => void;

  progress: number;
  recoveryMode: boolean;
  recoveryWaitLabel?: string | null;
}) {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const { t, workoutTitle } = useTranslation();
  const isCompleted = status === "completed";

  const isCurrent = status === "current";

  const isLocked = status === "locked";

  const canOpen = isCurrent;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animate the badge if this is the current day
  useEffect(() => {
    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isCurrent]);

  return (
    <Pressable
      style={[
        styles.dayCardBase,

        recoveryMode
          ? isCurrent
            ? {
                backgroundColor: palette.primarySoft,
                borderWidth: 1,
                borderColor: palette.info,
              }
            : isCompleted
              ? {
                  backgroundColor: palette.surfaceAlt,
                  borderWidth: 1,
                  borderColor: "#2E5964",
                }
              : {
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: "#23363B",
                }
          : isCurrent
            ? styles.dayCardCurrent
            : isCompleted
              ? styles.dayCardUnlocked
              : styles.dayCardLocked,
      ]}
      disabled={!canOpen}
      onPress={onPress}
    >
      {/* ✅ Animated TODAY badge */}
      {isCurrent && (
        <Animated.View
          style={[styles.todayBadge, { transform: [{ scale: scaleAnim }] }]}
        >
          <ThemedText style={styles.todayText}>{t("home.today")}</ThemedText>
        </Animated.View>
      )}

      <ThemedText
        type="subtitle"
        style={isLocked ? styles.dayTitleLocked : styles.dayTitleUnlocked}
      >
        {recoveryMode ? t("home.dayRecovery", { day: title.match(/Day\s*(\d+)/i)?.[1] ?? "" }) : workoutTitle(title)}
      </ThemedText>

      <ThemedText
        style={isLocked ? styles.dayTitleLocked : styles.dayTitleUnlocked}
      >
        {isCurrent
          ? recoveryMode
            ? t("home.beginRecovery")
            : t("home.start")
          : isCompleted
            ? t("home.completedLocked")
            : recoveryMode && recoveryWaitLabel
              ? recoveryWaitLabel
              : t("home.locked")}
      </ThemedText>

      {!recoveryMode && (
        <>
          {/* ✅ Progress bar */}
          <View style={styles.dayProgressBar}>
            <View
              style={[
                styles.progressBarFill, // fixed style key
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          {/* 🧪 Debug progress % */}
          <ThemedText style={{ marginTop: 4 }}>
            {Math.round(progress * 100)}%
          </ThemedText>
        </>
      )}

      {/* Icons */}
      {isCurrent && !recoveryMode && (
        <ThemedText style={{ marginTop: 6 }}>
          {includeWarmup ? "🔥" : ""} {includeStretch ? "🧘" : ""}
        </ThemedText>
      )}

      {/* Toggles */}
      {isCurrent && !recoveryMode && (
        <ThemedView style={styles.optionRow}>
          <Pressable
            onPress={toggleWarmup}
            style={[
              styles.optionCard,
              includeWarmup ? styles.optionActive : styles.optionInactive,
            ]}
          >
            <ThemedText style={styles.optionIcon}>🔥</ThemedText>
            <ThemedText style={styles.optionLabel}>{t("home.warmup")}</ThemedText>
          </Pressable>

          <Pressable
            onPress={toggleStretch}
            style={[
              styles.optionCard,
              includeStretch ? styles.optionActive : styles.optionInactive,
            ]}
          >
            <ThemedText style={styles.optionIcon}>🧘</ThemedText>
            <ThemedText style={styles.optionLabel}>{t("home.stretch")}</ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t, uiText, exerciseName, workoutTitle, language } = useTranslation();
  const styles = useAppStyles();
  const palette = useAppPalette();
  const listRef = useRef<FlatList<HomeTimelineItem>>(null);
  const allowHeaderExpandRef = useRef(true);
  const router = useRouter();
  const { openWeek1Coach } = useLocalSearchParams<{ openWeek1Coach?: string }>();
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [includeStretch, setIncludeStretch] = useState(true);
  const [showBaselineCoach, setShowBaselineCoach] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [showWeekExercises, setShowWeekExercises] = useState(false);
  const [isHomeHeaderCollapsed, setIsHomeHeaderCollapsed] = useState(false);
  const [currentDayHasStarted, setCurrentDayHasStarted] = useState(false);

  useEffect(() => {
    if (openWeek1Coach === "exercises") {
      setShowBaselineCoach(true);
      setShowWeekExercises(true);
      router.setParams({ openWeek1Coach: "" });
    }
  }, [openWeek1Coach, router]);
  const baselineCoachShownThisMount = useRef(false);
  const {
    generalSettings,
    isLoaded: isGeneralSettingsLoaded,
    markContextualTipSeen,
    setWeek1BaselineCoachEnabled,
  } = useGeneralSettings();
  const { trainingScheduleConfig } = useTrainingScheduleSettings();
  const { workoutRecoveryConfig } = useWorkoutRecoverySettings();
  const { dashboard, isLoaded: isAnalyticsLoaded } = useAnalytics("12w");

  const {
    program,
    day,
    week,
    getDayStatus,
    isLoaded,
    getDayProgress,
    activeDeload,
    trainingScheduleStatus,
    refreshProgressState,
  } = useProgress();

  useFocusEffect(
    useCallback(() => {
      if (!isLoaded) return;

      void refreshProgressState();
      let cancelled = false;
      void loadStartedProgramPosition().then((started) => {
        if (cancelled) return;
        setCurrentDayHasStarted(
          started?.programId === program.id &&
          started.weekIndex === week &&
          started.dayIndex === day,
        );
      });
      return () => { cancelled = true; };
    }, [isLoaded, refreshProgressState, program.id, week, day]),
  );

  useEffect(() => {
    if (!isLoaded || !isGeneralSettingsLoaded || baselineCoachShownThisMount.current) return;
    const welcomePending =
      generalSettings.contextualTipsEnabled &&
      !generalSettings.seenContextualTips.includes("welcome");

    if (welcomePending) {
      setShowWelcomeGuide(true);
      return;
    }

    if (week === 0 && generalSettings.week1BaselineCoachEnabled) {
      baselineCoachShownThisMount.current = true;
      setShowBaselineCoach(true);
    }
  }, [
    isLoaded,
    isGeneralSettingsLoaded,
    week,
    generalSettings.contextualTipsEnabled,
    generalSettings.seenContextualTips,
    generalSettings.week1BaselineCoachEnabled,
  ]);

  const isPainRecovery =
    activeDeload?.programId === program.id &&
    activeDeload.phase === "deload" &&
    activeDeload.reason === "pain" &&
    week === activeDeload.deloadWeekIndex;

  const isVerification =
    activeDeload?.programId === program.id &&
    activeDeload.phase === "verification" &&
    week === activeDeload.verificationWeekIndex;

  const verificationLevelNumber = program.level.match(/\d+/)?.[0] ?? "";
  const verificationLevelTitle = t("home.verificationProgress.levelTitle", { level: verificationLevelNumber });

  const recoveryAvailability = getRecoveryAvailabilityPresentation(
    isPainRecovery ? trainingScheduleStatus.nextEligibleDate : undefined,
    language,
  );

  const recoveryWaitLabel =
    isPainRecovery &&
    trainingScheduleStatus.canTrain === false &&
    recoveryAvailability.daysRemaining != null
      ? recoveryAvailability.daysRemaining === 1
        ? t("home.recoveryWait.oneDay")
        : t("home.recoveryWait.days", { count: recoveryAvailability.daysRemaining })
      : null;


  const effectiveTrainingCycle = getTrainingCycleForPreset({
    presetId: trainingScheduleConfig.trainingCyclePresetId,
    programDefaultCycle: program.recommendedCycle,
    programDayCount: program.days.length,
  });

  const trainingCycleName =
    TRAINING_CYCLE_PRESET_OPTIONS.find(
      (option) => option.id === trainingScheduleConfig.trainingCyclePresetId,
    )?.name ?? "Program Recommended";

  const showWeekTransition =
    !isPainRecovery &&
    !isVerification &&
    week > 0 &&
    day === 0 &&
    !currentDayHasStarted;

  const normalTimelineItems: HomeTimelineItem[] = isPainRecovery
    ? program.days.map((programDay, dayIndex) => ({
        type: "training" as const,
        dayIndex,
        title: programDay.title,
        phase: "current" as const,
      }))
    : effectiveTrainingCycle.slots.map((slot, slotIndex) =>
        slot.type === "training"
          ? {
              type: "training" as const,
              dayIndex: slot.dayIndex,
              title: program.days[slot.dayIndex]?.title ?? `Day ${slot.dayIndex + 1}`,
              phase: "current" as const,
            }
          : { type: "rest" as const, slotIndex, phase: "current" as const },
      );

  const timelineItems: HomeTimelineItem[] = showWeekTransition
    ? [
        ...effectiveTrainingCycle.slots.map((slot, slotIndex): HomeTimelineItem =>
          slot.type === "training"
            ? {
                type: "training",
                dayIndex: slot.dayIndex,
                title: program.days[slot.dayIndex]?.title ?? `Day ${slot.dayIndex + 1}`,
                phase: "previous",
              }
            : { type: "rest", slotIndex, phase: "previous" },
        ),
        { type: "week-transition", fromWeek: week, toWeek: week + 1 },
        {
          type: "training",
          dayIndex: 0,
          title: program.days[0]?.title ?? "Day 1",
          phase: "current",
        },
      ]
    : normalTimelineItems;

  const currentTimelineIndex = Math.max(
    0,
    timelineItems.findIndex(
      (item) => item.type === "training" && item.phase !== "previous" && item.dayIndex === day,
    ),
  );

  // ✅ Auto scroll to current day
  useEffect(() => {
    if (!isLoaded) return;
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: currentTimelineIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }, 100);
  }, [isLoaded, currentTimelineIndex]);

  // ✅ Debug
  useEffect(() => {
    if (!isLoaded) return;
    logWorkoutState("HOME SCREEN", program, week, day);
  }, [isLoaded, program, week, day]);

  if (!isLoaded) return null;
  const workoutsExpected = program.days.length;
  const workoutsCompleted = program.days.reduce(
    (count, _programDay, index) =>
      count + (getDayStatus(index) === "completed" ? 1 : 0),
    0,
  );

  const renderItem: ListRenderItem<HomeTimelineItem> = ({ item }) => {
    if (item.type === "week-transition") {
      return (
        <View style={{ marginBottom: 18, paddingVertical: 8 }}>
          <ThemedText style={{ color: palette.textMuted, fontWeight: "700" }}>
            {t("home.weekComplete", { week: item.fromWeek })}
          </ThemedText>
          <ThemedText type="subtitle" style={{ marginTop: 4 }}>
            {t("home.nextWeek", { week: item.toWeek })}
          </ThemedText>
        </View>
      );
    }

    if (item.type === "rest") {
      return (
        <View
          style={{
            minHeight: 122,
            marginBottom: 18,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.surfaceAlt,
            padding: 18,
            justifyContent: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="moon-outline" size={26} color={palette.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{t("home.recoveryDay")}</ThemedText>
              <ThemedText style={{ color: palette.textMuted, marginTop: 4 }}>
                {t("home.restRecoverPrepare")}
              </ThemedText>
              <ThemedText style={{ color: palette.primary, marginTop: 7, fontWeight: "700" }}>
                {item.phase === "previous" &&
                item.slotIndex < effectiveTrainingCycle.slots.reduce(
                  (last, slot, index) => slot.type === "training" ? index : last,
                  -1,
                )
                  ? t("home.pastRecoverySlot")
                  : t("home.recommendedNotRequired")}
              </ThemedText>
            </View>
          </View>
        </View>
      );
    }

    const dayIndex = item.dayIndex;
    const status: WorkoutAccessStatus = item.phase === "previous" ? "completed" : getDayStatus(dayIndex);
    const progress = item.phase === "previous" ? 1 : getDayProgress(dayIndex);

    return (
      <DayCard
        title={item.title}
        status={status}
        includeWarmup={includeWarmup}
        includeStretch={includeStretch}
        progress={progress}
        recoveryMode={isPainRecovery}
        recoveryWaitLabel={dayIndex === day ? recoveryWaitLabel : null}
        onPress={async () => {
          if (isPainRecovery) {
            const session = buildSession(program, dayIndex, {
              includeWarmup: false,
              includeStretch: false,
            });

            const startWorkoutTime = Date.now();
            if (workoutRecoveryConfig.enabled) {
              await createActiveWorkout({
                programId: program.id,
                weekIndex: week,
                dayIndex,
                startWorkoutTime,
                session,
              });
            }

            router.push({
              pathname: "/screens/workoutRunner",
              params: {
                session: JSON.stringify(session),
                blockIndex: "0",
                startWorkoutTime: startWorkoutTime.toString(),
              },
            });
            return;
          }

          if (
            trainingScheduleStatus.status === "rest-recommended" &&
            trainingScheduleStatus.reason === "normal-rest-recommended"
          ) {
            router.push({
              pathname: "/screens/recoveryCoach",
              params: {
                dayIndex: String(dayIndex),
                includeWarmup: includeWarmup ? "true" : "false",
                includeStretch: includeStretch ? "true" : "false",
              },
            });

            return;
          }

          router.push({
            pathname: "/screens/preWorkoutOverView",
            params: {
              dayIndex: String(dayIndex),
              includeWarmup: includeWarmup ? "true" : "false",
              includeStretch: includeStretch ? "true" : "false",
            },
          });
        }}
        toggleWarmup={() => setIncludeWarmup((previous) => !previous)}
        toggleStretch={() => setIncludeStretch((previous) => !previous)}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 🔥 STICKY TOP BAR */}
      {isVerification ? (
        <VerificationProgressHeader
          levelTitle={verificationLevelTitle}
          day={day}
          totalDays={program.days.length}
        />
      ) : (
        <TopProgressBar
          week={week}
          day={day}
          title={program.level}
          description={program.goals}
          recoveryMode={isPainRecovery}
          recoveryCanTrain={
            isPainRecovery ? trainingScheduleStatus.canTrain : undefined
          }
          recoveryDaysRemaining={
            isPainRecovery ? recoveryAvailability.daysRemaining : null
          }
          recoveryEligibleDateLabel={
            isPainRecovery ? recoveryAvailability.dateLabel : null
          }
          workoutsCompleted={workoutsCompleted}
          workoutsExpected={workoutsExpected}
          coachState={isAnalyticsLoaded ? dashboard.coach.state : "building-evidence"}
          coachHeadline={
            isAnalyticsLoaded
              ? uiText(dashboard.coach.headline)
              : uiText("Building your training picture")
          }
          matchOrBeatTrend={
            isAnalyticsLoaded
              ? dashboard.matchOrBeat.trend
              : "insufficient-data"
          }
          recoveryTrend={
            isAnalyticsLoaded
              ? dashboard.recovery.trend
              : "insufficient-data"
          }
          adherenceRate={
            isAnalyticsLoaded ? dashboard.overview.adherenceRate : null
          }
          baselineWeek={week === 0}
          compact={isHomeHeaderCollapsed}
        />
      )}

      {/* 📜 SCROLLABLE LIST */}
      <View
        style={{
          marginHorizontal: isHomeHeaderCollapsed ? 12 : 20,
          marginTop: isHomeHeaderCollapsed ? 2 : 14,
          paddingVertical: isHomeHeaderCollapsed ? 5 : 14,
          paddingHorizontal: isHomeHeaderCollapsed ? 10 : 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "800" }} numberOfLines={1}>
              {isHomeHeaderCollapsed ? uiText(trainingCycleName) : t("home.trainingCycle", { cycle: uiText(trainingCycleName) })}
            </ThemedText>
            <ThemedText
              style={{ color: palette.textMuted, marginTop: isHomeHeaderCollapsed ? 0 : 5, fontSize: isHomeHeaderCollapsed ? 11 : undefined }}
              numberOfLines={1}
            >
              {formatTrainingCycle(effectiveTrainingCycle).replaceAll("Rest", t("settings.schedule.restSlot"))}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setShowWelcomeGuide(true)}
            accessibilityRole="button"
            accessibilityLabel={t("home.openTipsA11y")}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: isHomeHeaderCollapsed ? 1 : 4, paddingHorizontal: isHomeHeaderCollapsed ? 2 : 6 }}
          >
            <Ionicons name="help-circle-outline" size={isHomeHeaderCollapsed ? 17 : 19} color={palette.primary} />
            {!isHomeHeaderCollapsed && (
              <ThemedText style={{ color: palette.primary, fontWeight: "800", fontSize: 13 }}>{t("home.tips")}</ThemedText>
            )}
          </Pressable>
        </View>
        {!isHomeHeaderCollapsed && (
          <ThemedText style={{ color: palette.textMuted, marginTop: 5, fontSize: 13 }}>
            {t("home.recoveryDaysTip")}
          </ThemedText>
        )}
      </View>

      <FlatList<HomeTimelineItem>
        ref={listRef}
        data={timelineItems}
        keyExtractor={(item, index) =>
          item.type === "training"
            ? `training-${item.phase ?? "current"}-${item.dayIndex}-${index}`
            : item.type === "week-transition"
              ? `week-transition-${item.fromWeek}-${item.toWeek}`
              : `rest-${item.phase ?? "current"}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: isHomeHeaderCollapsed ? 8 : 20,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          // After an automatic alignment, wait for the user's next gesture before
          // allowing the expanded header to return. This prevents a collapse ->
          // scrollToOffset(0) -> expand loop.
          allowHeaderExpandRef.current = true;
        }}
        onScroll={(event) => {
          // Verification uses its own fixed progress header. Normal training and
          // Pain Recovery share the same collapsible Home header behaviour so
          // the timeline/recovery cards can use the available screen space.
          if (isVerification) return;

          const offsetY = event.nativeEvent.contentOffset.y;

          if (!isHomeHeaderCollapsed && offsetY > 56) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            allowHeaderExpandRef.current = false;
            setIsHomeHeaderCollapsed(true);

            // The header has just released a large amount of vertical space.
            // Re-align the timeline to its beginning so Day 1 is shown from its
            // top edge, rather than leaving the first half scrolled off-screen.
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({ offset: 0, animated: true });
            });
            return;
          }

          if (
            isHomeHeaderCollapsed &&
            allowHeaderExpandRef.current &&
            offsetY <= 2
          ) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsHomeHeaderCollapsed(false);
          }
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 200);
        }}
      />


      <Modal
        visible={showWelcomeGuide}
        transparent
        animationType="fade"
        onRequestClose={() => {
          markContextualTipSeen("welcome");
          setShowWelcomeGuide(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", padding: 22 }}>
          <View style={{ maxHeight: "86%", backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.primary, padding: 20 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: palette.accent, fontWeight: "900", fontSize: 13, letterSpacing: 1.2 }}>{t("home.welcome.eyebrow")}</Text>
              <Text style={{ color: palette.text, fontWeight: "800", fontSize: 24, marginTop: 8 }}>{t("home.welcome.title")}</Text>
              <Text style={{ color: palette.textMuted, fontSize: 16, lineHeight: 23, marginTop: 14 }}>
                {t("home.welcome.body")}
              </Text>

              <View style={{ marginTop: 18, gap: 14 }}>
                <View>
                  <Text style={{ color: palette.text, fontWeight: "800", fontSize: 16 }}>📅 {t("home.welcome.cycleTitle")}</Text>
                  <Text style={{ color: palette.textMuted, lineHeight: 21, marginTop: 4 }}>
                    {t("home.welcome.cycleBody", { cycle: uiText(trainingCycleName), pattern: formatTrainingCycle(effectiveTrainingCycle).replaceAll("Rest", t("settings.schedule.restSlot")) })}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: palette.text, fontWeight: "800", fontSize: 16 }}>⏱️ {t("home.welcome.restTitle")}</Text>
                  <Text style={{ color: palette.textMuted, lineHeight: 21, marginTop: 4 }}>
                    {t("home.welcome.restBody")}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: palette.text, fontWeight: "800", fontSize: 16 }}>🧭 {t("home.welcome.coachingTitle")}</Text>
                  <Text style={{ color: palette.textMuted, lineHeight: 21, marginTop: 4 }}>
                    {t("home.welcome.coachingBody")}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: palette.text, fontWeight: "800", fontSize: 16 }}>💡 {t("home.welcome.helpTitle")}</Text>
                  <Text style={{ color: palette.textMuted, lineHeight: 21, marginTop: 4 }}>
                    {t("home.welcome.helpBody")}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  markContextualTipSeen("welcome");
                  setShowWelcomeGuide(false);
                }}
                style={{ marginTop: 22, borderRadius: 12, padding: 14, backgroundColor: palette.primary }}
              >
                <Text style={{ color: palette.background, fontWeight: "900", textAlign: "center" }}>{t("workout.continue")}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBaselineCoach}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBaselineCoach(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", padding: 22 }}>
          <View style={{ maxHeight: "86%", backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: "#2E7D32", padding: 20 }}>
            {!showWeekExercises ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ color: palette.accent, fontWeight: "900", fontSize: 13, letterSpacing: 1.2 }}>{t("home.week1Coach.eyebrow")}</Text>
                <Text style={{ color: palette.text, fontWeight: "800", fontSize: 24, marginTop: 8 }}>{t("home.week1Coach.title")}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 16, lineHeight: 23, marginTop: 14 }}>
                  {t("home.week1Coach.body1")}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 16, lineHeight: 23, marginTop: 12 }}>
                  {t("home.week1Coach.body2")}
                </Text>
                <Text style={{ color: palette.primary, fontSize: 15, lineHeight: 22, marginTop: 12, fontWeight: "700" }}>
                  {t("home.week1Coach.formWarning")}
                </Text>

                <Pressable onPress={() => setShowWeekExercises(true)} style={{ marginTop: 20, borderRadius: 12, padding: 14, backgroundColor: "#1B5E20" }}>
                  <Text style={{ color: palette.text, fontWeight: "800", textAlign: "center" }}>{t("home.week1Coach.viewExercises")}</Text>
                </Pressable>

                <Pressable
                  onPress={() => setWeek1BaselineCoachEnabled(!generalSettings.week1BaselineCoachEnabled)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16 }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: "#81C784", backgroundColor: generalSettings.week1BaselineCoachEnabled ? "transparent" : "#2E7D32", alignItems: "center", justifyContent: "center" }}>
                    {!generalSettings.week1BaselineCoachEnabled && <Text style={{ color: palette.text, fontWeight: "900" }}>✓</Text>}
                  </View>
                  <Text style={{ color: palette.textMuted, flex: 1 }}>{t("home.week1Coach.dontShow")}</Text>
                </Pressable>

                <Pressable onPress={() => setShowBaselineCoach(false)} style={{ paddingVertical: 12 }}>
                  <Text style={{ color: palette.primary, fontWeight: "800", textAlign: "center" }}>{t("home.week1Coach.gotIt")}</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <Pressable onPress={() => setShowWeekExercises(false)} style={{ paddingVertical: 8, paddingRight: 14 }}>
                    <Text style={{ color: palette.primary, fontWeight: "800" }}>‹ {t("home.week1Coach.coach")}</Text>
                  </Pressable>
                  <Text style={{ color: palette.text, fontSize: 20, fontWeight: "800", flex: 1 }}>{t("home.week1Coach.exercisesTitle")}</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {program.days.map((programDay, dayIndex) => (
                    <View key={programDay.id} style={{ marginBottom: 18 }}>
                      <Text style={{ color: palette.accent, fontWeight: "800", fontSize: 16, marginBottom: 7 }}>{workoutTitle(programDay.title)}</Text>
                      {programDay.exercises.filter((exercise) => !exercise.optional).map((exercise) => {
                        const definition = exerciseRegistry[exercise.exerciseId];
                        const guideId = definition?.guideId || exercise.exerciseId;
                        return (
                          <Pressable
                            key={`${dayIndex}-${exercise.exerciseId}`}
                            onPress={() => {
                              setShowBaselineCoach(false);
                              setShowWeekExercises(false);
                              router.push({
                                pathname: "/screens/exerciseGuideScreen",
                                params: { exerciseId: guideId, returnTo: "week1Coach" },
                              });
                            }}
                            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#26382A" }}
                          >
                            <Text style={{ color: palette.text, fontSize: 15 }}>{exerciseName(exercise.exerciseId, definition?.name || exercise.exerciseId)}  ›</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { logWorkoutState } from "@/utils/debugWorkout";
import { useAppStyles } from "../../styles/appStyles";
import TopProgressBar from "@/components/TopProgressBar";
import { buildSession } from "@/engine/sessionBuilder";
import { createActiveWorkout } from "@/storage/activeWorkoutStorage";
import { useWorkoutRecoverySettings } from "@/hooks/useWorkoutRecoverySettings";
import { useProgress, WorkoutAccessStatus } from "@/hooks/useProgress";
import VerificationProgressHeader from "@/components/VerificationProgressHeader";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { exerciseRegistry } from "@/data/exerciseRegistry";

type ProgramDay = {
  title: string;
  // add more if needed later
};

function parseLocalDateKey(dateKey?: string): Date | null {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getRecoveryAvailabilityPresentation(nextEligibleDate?: string) {
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
    dateLabel: eligible.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }),
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
                backgroundColor: "#173846",
                borderWidth: 1,
                borderColor: "#4FC3F7",
              }
            : isCompleted
              ? {
                  backgroundColor: "#14292F",
                  borderWidth: 1,
                  borderColor: "#2E5964",
                }
              : {
                  backgroundColor: "#101A1D",
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
          <ThemedText style={styles.todayText}>TODAY</ThemedText>
        </Animated.View>
      )}

      <ThemedText
        type="subtitle"
        style={isLocked ? styles.dayTitleLocked : styles.dayTitleUnlocked}
      >
        {recoveryMode ? title.replace(/-.*/, "- Recovery") : title}
      </ThemedText>

      <ThemedText
        style={isLocked ? styles.dayTitleLocked : styles.dayTitleUnlocked}
      >
        {isCurrent
          ? recoveryMode
            ? "Begin recovery"
            : "Start"
          : isCompleted
            ? "Completed 🔒"
            : recoveryMode && recoveryWaitLabel
              ? recoveryWaitLabel
              : "Locked"}
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
            <ThemedText style={styles.optionLabel}>Warm-up</ThemedText>
          </Pressable>

          <Pressable
            onPress={toggleStretch}
            style={[
              styles.optionCard,
              includeStretch ? styles.optionActive : styles.optionInactive,
            ]}
          >
            <ThemedText style={styles.optionIcon}>🧘</ThemedText>
            <ThemedText style={styles.optionLabel}>Stretch</ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const styles = useAppStyles();
  const listRef = useRef<FlatList<ProgramDay>>(null);
  const router = useRouter();
  const { openWeek1Coach } = useLocalSearchParams<{ openWeek1Coach?: string }>();
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [includeStretch, setIncludeStretch] = useState(true);
  const [showBaselineCoach, setShowBaselineCoach] = useState(false);
  const [showWeekExercises, setShowWeekExercises] = useState(false);

  useEffect(() => {
    if (openWeek1Coach === "exercises") {
      setShowBaselineCoach(true);
      setShowWeekExercises(true);
      router.setParams({ openWeek1Coach: "" });
    }
  }, [openWeek1Coach, router]);
  const baselineCoachShownThisMount = useRef(false);
  const { generalSettings, isLoaded: isGeneralSettingsLoaded, setWeek1BaselineCoachEnabled } = useGeneralSettings();
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
      if (!isLoaded) {
        return;
      }

      void refreshProgressState();
    }, [isLoaded, refreshProgressState]),
  );

  useEffect(() => {
    if (!isLoaded || !isGeneralSettingsLoaded || baselineCoachShownThisMount.current) return;
    if (week === 0 && generalSettings.week1BaselineCoachEnabled) {
      baselineCoachShownThisMount.current = true;
      setShowBaselineCoach(true);
    }
  }, [isLoaded, isGeneralSettingsLoaded, week, generalSettings.week1BaselineCoachEnabled]);

  const isPainRecovery =
    activeDeload?.programId === program.id &&
    activeDeload.phase === "deload" &&
    activeDeload.reason === "pain" &&
    week === activeDeload.deloadWeekIndex;

  const isVerification =
    activeDeload?.programId === program.id &&
    activeDeload.phase === "verification" &&
    week === activeDeload.verificationWeekIndex;

  const verificationLevelTitle = `${program.level.split(" - ")[0]} - Verification`;

  const recoveryAvailability = getRecoveryAvailabilityPresentation(
    isPainRecovery ? trainingScheduleStatus.nextEligibleDate : undefined,
  );

  const recoveryWaitLabel =
    isPainRecovery &&
    trainingScheduleStatus.canTrain === false &&
    recoveryAvailability.daysRemaining != null
      ? recoveryAvailability.daysRemaining === 1
        ? "Recovery in 1 day"
        : `Recovery in ${recoveryAvailability.daysRemaining} days`
      : null;


  // ✅ Auto scroll to current day
  useEffect(() => {
    if (!isLoaded) return;
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: day,
        animated: true,
        viewPosition: 0.5,
      });
    }, 100);
  }, [isLoaded, day]);

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

  const renderItem: ListRenderItem<ProgramDay> = ({ item, index }) => {
    const status = getDayStatus(index);

    const progress = getDayProgress(index);

    return (
      <DayCard
        title={item.title}
        status={status}
        includeWarmup={includeWarmup}
        includeStretch={includeStretch}
        progress={progress}
        recoveryMode={isPainRecovery}
        recoveryWaitLabel={index === day ? recoveryWaitLabel : null}
        onPress={async () => {
          if (isPainRecovery) {
            const session = buildSession(program, index, {
              includeWarmup: false,
              includeStretch: false,
            });

            const startWorkoutTime = Date.now();
            if (workoutRecoveryConfig.enabled) {
              await createActiveWorkout({
                programId: program.id,
                weekIndex: week,
                dayIndex: index,
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
                dayIndex: String(index),
                includeWarmup: includeWarmup ? "true" : "false",
                includeStretch: includeStretch ? "true" : "false",
              },
            });

            return;
          }

          router.push({
            pathname: "/screens/preWorkoutOverView",
            params: {
              dayIndex: String(index),
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
              ? dashboard.coach.headline
              : "Building your training picture"
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
        />
      )}

      {/* 📜 SCROLLABLE LIST */}
      <FlatList<ProgramDay>
        ref={listRef}
        data={program.days}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={140}
        getItemLayout={(_, index) => ({
          length: 140,
          offset: 140 * index,
          index,
        })}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
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
        visible={showBaselineCoach}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBaselineCoach(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", padding: 22 }}>
          <View style={{ maxHeight: "86%", backgroundColor: "#121A14", borderRadius: 18, borderWidth: 1, borderColor: "#2E7D32", padding: 20 }}>
            {!showWeekExercises ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ color: "#81C784", fontWeight: "900", fontSize: 13, letterSpacing: 1.2 }}>PBH COACH • WEEK 1</Text>
                <Text style={{ color: "white", fontWeight: "800", fontSize: 24, marginTop: 8 }}>Establish Your Baseline</Text>
                <Text style={{ color: "#D7E4D9", fontSize: 16, lineHeight: 23, marginTop: 14 }}>
                  This week is about learning your current exercise ability. Your results will help PBH establish your Match or Beat targets for future workouts.
                </Text>
                <Text style={{ color: "#D7E4D9", fontSize: 16, lineHeight: 23, marginTop: 12 }}>
                  Perform every exercise with good, controlled form. For repetitions and holds, work as close to your current maximum as you safely can while maintaining good technique.
                </Text>
                <Text style={{ color: "#FFD54F", fontSize: 15, lineHeight: 22, marginTop: 12, fontWeight: "700" }}>
                  Do not sacrifice form just to achieve another repetition or a few extra seconds.
                </Text>

                <Pressable onPress={() => setShowWeekExercises(true)} style={{ marginTop: 20, borderRadius: 12, padding: 14, backgroundColor: "#1B5E20" }}>
                  <Text style={{ color: "white", fontWeight: "800", textAlign: "center" }}>View This Week's Exercises ›</Text>
                </Pressable>

                <Pressable
                  onPress={() => setWeek1BaselineCoachEnabled(!generalSettings.week1BaselineCoachEnabled)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16 }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: "#81C784", backgroundColor: generalSettings.week1BaselineCoachEnabled ? "transparent" : "#2E7D32", alignItems: "center", justifyContent: "center" }}>
                    {!generalSettings.week1BaselineCoachEnabled && <Text style={{ color: "white", fontWeight: "900" }}>✓</Text>}
                  </View>
                  <Text style={{ color: "#D7E4D9", flex: 1 }}>Don't show this Week 1 introduction again</Text>
                </Pressable>

                <Pressable onPress={() => setShowBaselineCoach(false)} style={{ paddingVertical: 12 }}>
                  <Text style={{ color: "#FFD700", fontWeight: "800", textAlign: "center" }}>Got it</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <Pressable onPress={() => setShowWeekExercises(false)} style={{ paddingVertical: 8, paddingRight: 14 }}>
                    <Text style={{ color: "#FFD700", fontWeight: "800" }}>‹ Coach</Text>
                  </Pressable>
                  <Text style={{ color: "white", fontSize: 20, fontWeight: "800", flex: 1 }}>Week 1 Exercises</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {program.days.map((programDay, dayIndex) => (
                    <View key={programDay.id} style={{ marginBottom: 18 }}>
                      <Text style={{ color: "#81C784", fontWeight: "800", fontSize: 16, marginBottom: 7 }}>{programDay.title}</Text>
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
                            <Text style={{ color: "#F1F5F2", fontSize: 15 }}>{definition?.name || exercise.exerciseId}  ›</Text>
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

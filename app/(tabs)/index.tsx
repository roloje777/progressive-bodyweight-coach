//app/(tabs)/index.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Pressable,
  Platform,
  FlatList,
  View,
  ListRenderItem,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { logWorkoutState } from "@/utils/debugWorkout";
import { appStyles as styles } from "../../styles/appStyles";
import TopProgressBar from "@/components/TopProgressBar";
import { calculateProgramStats } from "@/utils/calculateProgramStats";
import { buildSession } from "@/engine/sessionBuilder";
import { useProgress, WorkoutAccessStatus } from "@/hooks/useProgress";

type ProgramDay = {
  title: string;
  // add more if needed later
};

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
}) {
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
            : "Locked"}
      </ThemedText>

      {!recoveryMode && (<>
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

      </>)}

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
  const listRef = useRef<FlatList<ProgramDay>>(null);
  const router = useRouter();
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [includeStretch, setIncludeStretch] = useState(true);

  const {
    program,
    day,
    week,
    getDayStatus,
    isLoaded,
    getDayProgress,
    activeDeload,
  } = useProgress();

  const isPainRecovery =
    activeDeload?.programId === program.id &&
    activeDeload.phase === "deload" &&
    activeDeload.reason === "pain" &&
    week === activeDeload.deloadWeekIndex;

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
  const stats = calculateProgramStats(program);

  const totalProgramDays = program.days.length * program.weeks;
  const currentDayIndex = week * program.days.length + day;

  const daysLeft = totalProgramDays - currentDayIndex;

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
        onPress={() => {
          if (isPainRecovery) {
            const session = buildSession(program, index, {
              includeWarmup: false,
              includeStretch: false,
            });

            router.push({
              pathname: "/screens/workoutRunner",
              params: {
                session: JSON.stringify(session),
                blockIndex: "0",
                startWorkoutTime: Date.now().toString(),
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
      <TopProgressBar
        effectiveness={stats.avgEffectiveness}
        difficulty={stats.avgDifficulty}
        avgSets={stats.avgSets}
        avgReps={stats.avgReps}
        daysPerWeek={program.days.length}
        weeks={program.weeks}
        daysLeft={daysLeft}
        week={week}
        day={day}
        totalDays={program.days.length}
        title={program.level}
        description={program.goals}
        recoveryMode={isPainRecovery}
      />

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
    </View>
  );
}

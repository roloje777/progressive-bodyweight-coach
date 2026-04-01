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
import { useProgress } from "@/hooks/useProgress";
import { logWorkoutState } from "@/utils/debugWorkout";
import { appStyles as styles } from "../../styles/appStyles";

type ProgramDay = {
  title: string;
  // add more if needed later
};

// ✅ DayCard component handles individual cards + animated badge
function DayCard({
  title,
  unlocked,
  isCurrent,
  includeWarmup,
  includeStretch,
  onPress,
  toggleWarmup,
  toggleStretch,
  progress,
}: {
  title: string;
  unlocked: boolean;
  isCurrent: boolean;
  includeWarmup: boolean;
  includeStretch: boolean;
  onPress: () => void;
  toggleWarmup: () => void;
  toggleStretch: () => void;
  progress: number;
}) {
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
        ])
      ).start();
    }
  }, [isCurrent]);

  return (
    <Pressable
      style={[
        styles.dayCardBase,
        unlocked
          ? isCurrent
            ? styles.dayCardCurrent
            : styles.dayCardUnlocked
          : styles.dayCardLocked,
      ]}
      disabled={!unlocked}
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
        style={unlocked ? styles.dayTitleUnlocked : styles.dayTitleLocked}
      >
        {title}
      </ThemedText>

      <ThemedText
        style={unlocked ? styles.dayStatusUnlocked : styles.dayStatusLocked}
      >
        {isCurrent ? "Continue" : unlocked ? "Start" : "Locked"}
      </ThemedText>

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

      {/* Icons */}
      {isCurrent && (
        <ThemedText style={{ marginTop: 6 }}>
          {includeWarmup ? "🔥" : ""} {includeStretch ? "🧘" : ""}
        </ThemedText>
      )}

      {/* Toggles */}
      {isCurrent && (
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
  isDayUnlocked,
  isLoaded,
  getDayProgress,
} = useProgress();

 
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

  const renderItem: ListRenderItem<ProgramDay> = ({ item, index }) => {
    const unlocked = isDayUnlocked(index);
    const isCurrent = index === day;
     const progress = getDayProgress(index);

    return (
      <DayCard
        title={item.title}
        unlocked={unlocked}
        isCurrent={isCurrent}
        includeWarmup={includeWarmup}
        includeStretch={includeStretch}
        progress={progress} // ✅ PASS IT HERE
        onPress={() =>
          router.push({
            pathname: "/screens/preWorkoutOverView",
            params: {
              dayIndex: String(index),
              includeWarmup: includeWarmup ? "true" : "false",
              includeStretch: includeStretch ? "true" : "false",
            },
          })
        }
        toggleWarmup={() => setIncludeWarmup((prev) => !prev)}
        toggleStretch={() => setIncludeStretch((prev) => !prev)}
         progress={progress}
      />
    );
  };

  return (
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
      ListHeaderComponent={
        <ThemedView style={styles.header}>
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
            <ThemedText type="title">{program.name}</ThemedText>
          </Pressable>

          <ThemedText>{program.level}</ThemedText>
          <ThemedText>{program.goals}</ThemedText>
          <ThemedText>Week {week + 1}</ThemedText>

          <ThemedText style={styles.progressText}>
            Day {day + 1} of {program.days.length}
          </ThemedText>
        </ThemedView>
      }
      contentContainerStyle={{ padding: 20, backgroundColor: "#111" }}
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
  );
}
import { Pressable, Platform, FlatList, ListRenderItem } from "react-native";
import { useRef, useEffect, useState } from "react";
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

export default function HomeScreen() {

  const listRef = useRef<FlatList<ProgramDay>>(null);

  const router = useRouter();
  const { program, day, week, isDayUnlocked, isLoaded } = useProgress();
 

  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [includeStretch, setIncludeStretch] = useState(true);

  // ✅ Auto scroll to current day
  useEffect(() => {
    if (!isLoaded) return;

    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: day,
        animated: true,
        viewPosition: 0.3, // 👈 nice positioning
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
      >
        <ThemedText
          type="subtitle"
          style={unlocked ? styles.dayTitleUnlocked : styles.dayTitleLocked}
        >
          {item.title}
        </ThemedText>

        <ThemedText
          style={unlocked ? styles.dayStatusUnlocked : styles.dayStatusLocked}
        >
          {isCurrent ? "Continue" : unlocked ? "Start" : "Locked"}
        </ThemedText>

        {/* ICONS */}
        {isCurrent && (
          <ThemedText style={{ marginTop: 6 }}>
            {includeWarmup ? "🔥" : ""} {includeStretch ? "🧘" : ""}
          </ThemedText>
        )}

        {/* TOGGLES */}
        {isCurrent && (
          <ThemedView style={styles.optionRow}>
            <Pressable
              onPress={() => setIncludeWarmup((prev) => !prev)}
              style={[
                styles.optionCard,
                includeWarmup ? styles.optionActive : styles.optionInactive,
              ]}
            >
              <ThemedText style={styles.optionIcon}>🔥</ThemedText>
              <ThemedText style={styles.optionLabel}>Warm-up</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setIncludeStretch((prev) => !prev)}
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
  };

  return (
    <FlatList<ProgramDay>
      ref={listRef}
      data={program.days}
      keyExtractor={(_, index) => index.toString()}
      renderItem={renderItem}
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
        // ✅ fallback (important!)
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

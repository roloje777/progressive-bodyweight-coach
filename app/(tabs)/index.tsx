import { StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useProgress } from "@/hooks/useProgress";

export default function HomeScreen() {
  const router = useRouter();
  const { program, day, week, isDayUnlocked } = useProgress();

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">{program.name}</ThemedText>
        <ThemedText>{program.level}</ThemedText>
        <ThemedText>{program.goals}</ThemedText>
        <ThemedText>Week {week + 1}</ThemedText>

        {/* Progress Indicator */}
        <ThemedText style={styles.progressText}>
          Day {day + 1} of {program.days.length}
        </ThemedText>
      </ThemedView>

      {/* DAYS */}
      <ThemedView style={styles.daysContainer}>
        {program.days.map((d, index) => {
          const unlocked = isDayUnlocked(index);
          const isCurrent = index === day;

          return (
            <Pressable
              key={index}
              style={[
                styles.dayCard,
                {
                  backgroundColor: unlocked
                    ? isCurrent
                      ? "#4CAF50" // current
                      : "#2C2C2E" // unlocked
                    : "#1A1A1A", // locked
                },
              ]}
              disabled={!unlocked}
              onPress={() =>
                router.push({
                  pathname: "/screens/workoutFlow",
                  params: { dayIndex: index },
                })
              }
            >
              <ThemedText
                type="subtitle"
                style={{
                  color: unlocked ? "#fff" : "#777",
                }}
              >
                {d.title}
              </ThemedText>

              <ThemedText
                style={{
                  color: unlocked ? "#fff" : "#555",
                }}
              >
                {isCurrent ? "Continue" : unlocked ? "Start" : "Locked"}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>

      {/* NEXT PROGRAMS */}
      <ThemedView style={styles.nextSection}>
        <ThemedText type="subtitle">Next Levels</ThemedText>

        <ThemedView style={styles.lockedPrograms}>
          <ThemedText>Level 2 - Growth (Locked)</ThemedText>
          <ThemedText>Level 3 - Max Hypertrophy (Locked)</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    gap: 4,
  },
  progressText: {
    marginTop: 8,
  },
  daysContainer: {
    gap: 16,
  },
  dayCard: {
    padding: 18,
    borderRadius: 16,
  },
  nextSection: {
    marginTop: 32,
  },
  lockedPrograms: {
    marginTop: 12,
    opacity: 0.4,
  },
});

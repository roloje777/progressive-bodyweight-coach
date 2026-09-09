import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";

import rawGuides from "@/data/exerciseGuide.json";
import { ExerciseGuideMap } from "@/models/ExerciseGuide";

type GuideListItem = {
  id: string;
  title: string;
  image: string;
  videoUrl: string;
  videoKey: string;
};

export default function ExerciseGuidesTestScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const guides = rawGuides as ExerciseGuideMap;

  const exercises = useMemo<GuideListItem[]>(() => {
    return Object.entries(guides)
      .map(([id, guide]) => ({
        id,
        title: guide.title,
        image: guide.image ?? "",
        videoUrl: guide.videoUrl ?? "",
        videoKey: guide.videoKey ?? "",
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [guides]);

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return exercises;

    return exercises.filter(
      (exercise) =>
        exercise.title.toLowerCase().includes(query) ||
        exercise.id.toLowerCase().includes(query),
    );
  }, [exercises, search]);

  const openGuide = (exerciseId: string) => {
    router.push({
      pathname: "/screens/exerciseGuideScreen",
      params: { exerciseId },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Exercise Guide Tests" }} />

      <View style={styles.header}>
        <Text style={styles.title}>Exercise Guide Tests</Text>
        <Text style={styles.subtitle}>
          Tap an exercise to open its complete guide.
        </Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by exercise name or id..."
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />

        <Text style={styles.countText}>
          Showing {filteredExercises.length} of {exercises.length} guides
        </Text>
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => {
          const hasImage = item.image.trim() !== "";
          const hasVideo =
            item.videoUrl.trim() !== "" || item.videoKey.trim() !== "";

          return (
            <Pressable
              onPress={() => openGuide(item.id)}
              style={({ pressed }) => [
                styles.exerciseRow,
                pressed && styles.exerciseRowPressed,
              ]}
            >
              <View style={styles.numberContainer}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>

              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseTitle}>{item.title}</Text>
                <Text style={styles.exerciseId}>{item.id}</Text>

                <View style={styles.statusRow}>
                  <Text
                    style={[
                      styles.statusText,
                      hasImage ? styles.statusOk : styles.statusMissing,
                    ]}
                  >
                    Image: {hasImage ? "Yes" : "Missing"}
                  </Text>

                  <Text
                    style={[
                      styles.statusText,
                      hasVideo ? styles.statusOk : styles.statusMissing,
                    ]}
                  >
                    Video: {hasVideo ? "Yes" : "Missing"}
                  </Text>
                </View>
              </View>

              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercise guides found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111111",
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 14,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d6d6d6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#111111",
  },
  countText: {
    marginTop: 10,
    fontSize: 13,
    color: "#666666",
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e4e4e4",
  },
  exerciseRowPressed: {
    opacity: 0.65,
  },
  numberContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eeeeee",
    marginRight: 12,
  },
  numberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  exerciseId: {
    marginTop: 3,
    fontSize: 12,
    color: "#777777",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 7,
  },
  statusText: {
    fontSize: 12,
    marginRight: 14,
    fontWeight: "600",
  },
  statusOk: {
    color: "#2e7d32",
  },
  statusMissing: {
    color: "#c62828",
  },
  chevron: {
    marginLeft: 10,
    fontSize: 30,
    lineHeight: 32,
    color: "#777777",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#777777",
  },
});

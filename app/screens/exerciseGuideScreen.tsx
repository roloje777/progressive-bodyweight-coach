import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Image, Linking, Pressable } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import rawGuides from "@/data/exerciseGuide.json";
import { ExerciseGuideMap } from "@/models/ExerciseGuide";
import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { exerciseImages } from "@/utils/exerciseImages";
import { markExerciseGuideVideoBackground } from "@/storage/activeWorkoutStorage";

const Indicator = ({ level }: { level: number }) => {
  const palette = useAppPalette();
  return (
    <View style={{ flexDirection: "row", marginBottom: 10 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: 20,
            height: 8,
            marginRight: 4,
            borderRadius: 4,
            backgroundColor: i <= level ? palette.accent : palette.textMuted,
          }}
        />
      ))}
    </View>
  );
};

export default function ExerciseGuideScreen() {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const router = useRouter();
  const guides: ExerciseGuideMap = rawGuides;
  const {
    exerciseId,
    returnTo,
    workoutGuide,
    guideContext,
    restKind,
    restStartedAt,
    restDurationSeconds,
  } = useLocalSearchParams<{
    exerciseId?: string;
    returnTo?: string;
    workoutGuide?: string;
    guideContext?: "current" | "up-next";
    restKind?: "rest-set" | "rest-exercise";
    restStartedAt?: string;
    restDurationSeconds?: string;
  }>();

  const restDeadline = useMemo(() => {
    const startedAt = Number(restStartedAt);
    const durationSeconds = Number(restDurationSeconds);

    if (
      !Number.isFinite(startedAt) ||
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0
    ) {
      return null;
    }

    return startedAt + durationSeconds * 1000;
  }, [restStartedAt, restDurationSeconds]);

  const getRestSecondsLeft = () =>
    restDeadline == null
      ? null
      : Math.max(0, Math.ceil((restDeadline - Date.now()) / 1000));

  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(
    getRestSecondsLeft,
  );

  useEffect(() => {
    if (restDeadline == null) {
      setRestSecondsLeft(null);
      return;
    }

    const update = () => setRestSecondsLeft(getRestSecondsLeft());
    update();

    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [restDeadline]);

  const guide = guides[exerciseId as keyof typeof guides];
  if (!guide) {
    return (
      <View style={styles.container}>
        <Text>Exercise not found</Text>
      </View>
    );
  }
  const openVideo = async (url: string) => {
    if (!url) return;

    // Opening the guide video backgrounds PBH. When the guide was opened from
    // an active workout, that viewing time is part of the workout rather than
    // an interruption and should remain in the workout/block duration.
    if (workoutGuide === "true") {
      await markExerciseGuideVideoBackground();
    }

    await Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {workoutGuide === "true" && restSecondsLeft != null && (
        <View
          style={{
            width: "100%",
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: palette.surfaceElevated,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                color: palette.textMuted,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {restSecondsLeft > 0
                ? restKind === "rest-exercise"
                  ? "REST BEFORE NEXT EXERCISE"
                  : "REST BEFORE NEXT SET"
                : "REST COMPLETE"}
            </Text>
            <Text
              style={{
                color: palette.text,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {guideContext === "up-next" ? "Up next" : "Current exercise"}
            </Text>
          </View>

          <Text
            style={{
              color: restSecondsLeft > 0 ? palette.primary : palette.accent,
              fontSize: 24,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
          >
            {restSecondsLeft > 0 ? `${restSecondsLeft}s` : "GO!"}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            if (returnTo === "week1Coach") {
              router.replace({
                pathname: "/",
                params: { openWeek1Coach: "exercises" },
              });
              return;
            }
            router.back();
          }}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            paddingHorizontal: 4,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              color: palette.primary,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            ‹ Back
          </Text>
        </Pressable>

        {/* Title */}
        <Text style={styles.title}>{guide.title}</Text>

        {/* Image */}
        <Image
          source={
            exerciseImages[guide.image] ??
            require("@/assets/images/exercises/placeholder.png")
          }
          style={styles.exerciseImage}
          resizeMode="contain"
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.text}>{guide.description}</Text>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.tagContainer}>
          {guide.category.map((cat, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{cat}</Text>
            </View>
          ))}
        </View>

        {/* Muscles */}
        <Text style={styles.sectionTitle}>Muscles Worked</Text>

        <Text style={styles.subSectionTitle}>Primary</Text>
        <View style={styles.tagContainer}>
          {guide.muscles.primary.map((muscle, i) => (
            <View key={i} style={[styles.tag, styles.primaryTag]}>
              <Text style={styles.tagText}>{muscle}</Text>
            </View>
          ))}
        </View>

        {guide.muscles.secondary.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>Secondary</Text>
            <View style={styles.tagContainer}>
              {guide.muscles.secondary.map((muscle, i) => (
                <View key={i} style={[styles.tag, styles.secondaryTag]}>
                  <Text style={styles.tagText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Difficulty */}
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <Indicator level={guide.difficulty} />

        {/* Effectiveness */}
        <Text style={styles.sectionTitle}>Hypertrophy Effectiveness</Text>
        <Indicator level={guide.effectiveness} />

        {/* Steps */}
        <Text style={styles.sectionTitle}>How to Perform</Text>
        {guide.steps.map((step, i) => (
          <Text key={i} style={styles.text}>
            {i + 1}. {step}
          </Text>
        ))}

        {/* Video */}
        {guide.videoUrl && guide.videoUrl.trim() !== "" ? (
          <>
            <Text style={styles.sectionTitle}>Watch Video</Text>

            <Pressable
              style={styles.videoLinkButton}
              onPress={() => openVideo(guide.videoUrl)}
            >
              <Text style={styles.videoLinkText}>Open Video</Text>
            </Pressable>
          </>
        ) : null}

        {/* Safety */}
        <Text style={styles.sectionTitle}>Safety</Text>
        {guide.safety.map((item, i) => (
          <Text key={i} style={styles.warningText}>
            • {item}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

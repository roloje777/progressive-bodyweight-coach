// app/(tabs)/settings.tsx

import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAppStyles } from "@/styles/appStyles";

type SettingsSection = {
  key: "general" | "training-schedule" | "adaptive-rest" | "adaptive-volume" | "workout-recovery";
  title: string;
  description: string;
  icon: string;
};

const sections: SettingsSection[] = [
  {
    key: "general",
    title: "General",
    description: "Program introductions, coaching guidance and general preferences.",
    icon: "⚙️",
  },
  {
    key: "training-schedule",
    title: "Training Schedule",
    description: "Recovery guidance, training cycle and pain-recovery spacing.",
    icon: "📅",
  },
  {
    key: "adaptive-rest",
    title: "Adaptive Rest",
    description: "Rest timing, adaptive mode and exercise effort ratings.",
    icon: "⏱️",
  },
  {
    key: "adaptive-volume",
    title: "Adaptive Volume",
    description: "Adaptive volume enablement, start week and qualifying ratings.",
    icon: "📈",
  },
  {
    key: "workout-recovery",
    title: "Workout Recovery",
    description: "Interrupted-workout recovery, guidance and progression handling.",
    icon: "↻",
  },
];

export default function SettingsScreen() {
  const styles = useAppStyles();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.scheduleSettingsScreen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scheduleSettingsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.scheduleSettingsTitle}>Settings</Text>

        <Text style={styles.scheduleSettingDescription}>
          Choose a category to configure. Each category keeps its own Restore
          Defaults action.
        </Text>

        <View style={{ gap: 12, marginTop: 12 }}>
          {sections.map((section) => (
            <Pressable
              key={section.key}
              onPress={() =>
                router.push({
                  pathname: "/screens/settingsSection",
                  params: { section: section.key },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Open ${section.title} settings`}
              style={({ pressed }) => [
                styles.scheduleSettingCard,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 26 }}>{section.icon}</Text>

              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleSettingTitle}>{section.title}</Text>
                <Text style={styles.scheduleSettingDescription}>
                  {section.description}
                </Text>
              </View>

              <Text style={{ color: "#aaa", fontSize: 24 }}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text
          style={[styles.scheduleSettingDescription, { marginTop: 24, marginBottom: 8, color: "#8BEA9A", fontWeight: "800" }]}
        >
          SUPPORT
        </Text>

        <Pressable
          onPress={() => router.push("/screens/helpAbout")}
          accessibilityRole="button"
          accessibilityLabel="Open Help and About"
          style={({ pressed }) => [
            styles.scheduleSettingCard,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 26 }}>❓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.scheduleSettingTitle}>Help & About</Text>
            <Text style={styles.scheduleSettingDescription}>
              Getting started, FAQs, support, app information and health guidance.
            </Text>
          </View>
          <Text style={{ color: "#aaa", fontSize: 24 }}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

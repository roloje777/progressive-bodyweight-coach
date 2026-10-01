// app/(tabs)/settings.tsx

import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/i18n";

type SettingsSection = {
  key: "general" | "training-schedule" | "adaptive-rest" | "adaptive-volume" | "workout-recovery";
  title: string;
  description: string;
  icon: string;
};

const sectionDefinitions: Array<{
  key: SettingsSection["key"];
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
}> = [
  { key: "general", titleKey: "settings.general.title", descriptionKey: "settings.general.description", icon: "⚙️" },
  { key: "training-schedule", titleKey: "settings.trainingSchedule.title", descriptionKey: "settings.trainingSchedule.description", icon: "📅" },
  { key: "adaptive-rest", titleKey: "settings.adaptiveRest.title", descriptionKey: "settings.adaptiveRest.description", icon: "⏱️" },
  { key: "adaptive-volume", titleKey: "settings.adaptiveVolume.title", descriptionKey: "settings.adaptiveVolume.description", icon: "📈" },
  { key: "workout-recovery", titleKey: "settings.workoutRecovery.title", descriptionKey: "settings.workoutRecovery.description", icon: "↻" },
];

export default function SettingsScreen() {
  const styles = useAppStyles();
  const palette = useAppPalette();
  const router = useRouter();
  const { t } = useTranslation();
  const sections: SettingsSection[] = sectionDefinitions.map((section) => ({
    key: section.key,
    title: t(section.titleKey),
    description: t(section.descriptionKey),
    icon: section.icon,
  }));

  return (
    <SafeAreaView style={styles.scheduleSettingsScreen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scheduleSettingsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.scheduleSettingsTitle}>{t("settings.title")}</Text>

        <Text style={styles.scheduleSettingDescription}>
          {t("settings.description")}
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
              accessibilityLabel={t("settings.openSectionA11y", { section: section.title })}
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

              <Text style={{ color: palette.textMuted, fontSize: 24 }}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text
          style={[styles.scheduleSettingDescription, { marginTop: 24, marginBottom: 8, color: "#8BEA9A", fontWeight: "800" }]}
        >
          {t("settings.support.title")}
        </Text>

        <Pressable
          onPress={() => router.push("/screens/helpAbout")}
          accessibilityRole="button"
          accessibilityLabel={t("settings.helpAbout.openA11y")}
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
            <Text style={styles.scheduleSettingTitle}>{t("settings.helpAbout.title")}</Text>
            <Text style={styles.scheduleSettingDescription}>
              {t("settings.helpAbout.description")}
            </Text>
          </View>
          <Text style={{ color: palette.textMuted, fontSize: 24 }}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

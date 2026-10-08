import { Tabs } from "expo-router";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTranslation } from "@/hooks/useTranslation";

export default function TabLayout() {
  const colorScheme = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.workout"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="fitness-center" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: t("tabs.history"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="history" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: t("tabs.progress"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="insights" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

//app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect } from "react";
// import { soundManager } from "../services/SoundManagerExpoAv";
import { soundManager } from "../services/SoundManager";
import { ProgressProvider } from "@/context/ProgressContext";
import { TrainingScheduleSettingsProvider } from "@/context/TrainingScheduleSettingsContext";
import { AdaptiveVolumeSettingsProvider } from "@/context/AdaptiveVolumeSettingsContext";
import { AdaptiveRestSettingsProvider } from "@/context/AdaptiveRestSettingsContext";


export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {

  useEffect(() => {
    const init = async () => {
      await soundManager.loadSounds();
    };

    init();

    return () => {
      // Optional: clean up when app closes
      soundManager.unload();
    };
  }, []);
  const colorScheme = useColorScheme();

  // return (
  //   <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
  //     <Stack>
  //       {/* ✅ TABS (main app) */}
  //       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

  //       {/* 🔥 WORKOUT FLOW (NO TABS) */}
  //       <Stack.Screen
  //         name="screens/dynamicWarmUp"
  //         options={{ headerShown: false }}
  //       />
  //       <Stack.Screen name="screens/workout" options={{ headerShown: false }} />
  //       <Stack.Screen
  //         name="screens/staticStretch"
  //         options={{ headerShown: false }}
  //       />
  //       <Stack.Screen
  //         name="screens/workoutSummary"
  //         options={{ headerShown: false }}
  //       />

  //       {/* OPTIONAL */}
  //       <Stack.Screen
  //         name="modal"
  //         options={{ presentation: "modal", title: "Modal" }}
  //       />
  //     </Stack>
  //     <StatusBar style="auto" />
  //   </ThemeProvider>
  // );
  return (
  <TrainingScheduleSettingsProvider>
  <AdaptiveVolumeSettingsProvider>
  <AdaptiveRestSettingsProvider>
  <ProgressProvider>
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack>
        {/* TABS */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* WORKOUT FLOW */}
        <Stack.Screen
          name="screens/dynamicWarmUp"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="screens/workout"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="screens/staticStretch"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="screens/workoutSummary"
          options={{
            headerShown: false,
          }}
        />

        {/* GRADUATION */}
        <Stack.Screen
          name="screens/graduationCoach"
          options={{
            headerShown: false,
          }}
        />

        {/* OPTIONAL */}
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  </ProgressProvider>
  </AdaptiveRestSettingsProvider>
  </AdaptiveVolumeSettingsProvider>
  </TrainingScheduleSettingsProvider>
);
}

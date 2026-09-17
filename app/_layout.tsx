// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  View,
} from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { soundManager } from "../services/SoundManager";
import { ProgressProvider } from "@/context/ProgressContext";
import { TrainingScheduleSettingsProvider } from "@/context/TrainingScheduleSettingsContext";
import { AdaptiveVolumeSettingsProvider } from "@/context/AdaptiveVolumeSettingsContext";
import { AdaptiveRestSettingsProvider } from "@/context/AdaptiveRestSettingsContext";
import { WorkoutRecoverySettingsProvider } from "@/context/WorkoutRecoverySettingsContext";
import { GeneralSettingsProvider } from "@/context/GeneralSettingsContext";
import WorkoutRecoveryGate from "@/components/WorkoutRecoveryGate";

// Keep the native splash visible until the React tree has mounted. The custom
// splash below then takes over, so startup never flashes the app underneath.
void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

const MIN_SPLASH_VISIBLE_MS = 900;
const SPLASH_FADE_MS = 350;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const nativeSplashHidden = useRef(false);

  useEffect(() => {
    let mounted = true;

    const prepare = async () => {
      const startedAt = Date.now();

      try {
        await soundManager.loadSounds();
      } catch (error) {
        // A sound-loading problem must not prevent the application from opening.
        console.warn("Unable to preload sounds during startup:", error);
      }

      const remaining = Math.max(
        0,
        MIN_SPLASH_VISIBLE_MS - (Date.now() - startedAt),
      );

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      if (mounted) {
        setAppReady(true);
      }
    };

    void prepare();

    return () => {
      mounted = false;
      soundManager.unload();
    };
  }, []);

  const hideNativeSplash = useCallback(() => {
    if (nativeSplashHidden.current) return;

    nativeSplashHidden.current = true;
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!appReady || !nativeSplashHidden.current) return;

    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: SPLASH_FADE_MS,
      useNativeDriver: true,
    }).start(() => setShowSplash(false));
  }, [appReady, splashOpacity]);

  return (
    <View style={styles.root} onLayout={hideNativeSplash}>
      <GeneralSettingsProvider>
      <WorkoutRecoverySettingsProvider>
        <TrainingScheduleSettingsProvider>
          <AdaptiveVolumeSettingsProvider>
            <AdaptiveRestSettingsProvider>
              <ProgressProvider>
                <ThemeProvider
                  value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                  <WorkoutRecoveryGate />
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                    <Stack.Screen
                      name="screens/dynamicWarmUp"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="screens/workout"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="screens/staticStretch"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="screens/workoutSummary"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="screens/workoutRecovery"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="screens/manualWorkoutRecovery"
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen
                      name="screens/graduationCoach"
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen
                      name="modal"
                      options={{ presentation: "modal", title: "Modal" }}
                    />
                  </Stack>

                  <StatusBar style="auto" />
                </ThemeProvider>
              </ProgressProvider>
            </AdaptiveRestSettingsProvider>
          </AdaptiveVolumeSettingsProvider>
        </TrainingScheduleSettingsProvider>
      </WorkoutRecoverySettingsProvider>
      </GeneralSettingsProvider>

      {showSplash && (
        <Animated.View
          pointerEvents="none"
          style={[styles.splashOverlay, { opacity: splashOpacity }]}
        >
          <Image
            source={require("../assets/images/splash-screen.png")}
            resizeMode="contain"
            style={styles.splashImage}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020704",
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020704",
  },
  splashImage: {
    width: "100%",
    height: "100%",
  },
});

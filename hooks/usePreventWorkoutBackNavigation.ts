import { useCallback } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import { useFocusEffect } from "expo-router";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";

/** Prevents Android hardware/system Back from leaving an active exercise screen. */
export function usePreventWorkoutBackNavigation() {
  const { generalSettings, isLoaded } = useGeneralSettings();
  const preventBack = isLoaded && generalSettings.preventBackNavigationDuringWorkout;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android" || !preventBack) return;

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          ToastAndroid.show(
            "Back navigation is disabled during an active workout to prevent accidental interruption. You can change this in General Settings → Prevent Back Navigation.",
            ToastAndroid.SHORT,
          );
          return true;
        },
      );

      return () => subscription.remove();
    }, [preventBack]),
  );
}

import { useCallback } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import { useFocusEffect } from "expo-router";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { useTranslation } from "@/hooks/useTranslation";

/** Prevents Android hardware/system Back from leaving an active exercise screen. */
export function usePreventWorkoutBackNavigation() {
  const { generalSettings, isLoaded } = useGeneralSettings();
  const { t } = useTranslation();
  const preventBack = isLoaded && generalSettings.preventBackNavigationDuringWorkout;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android" || !preventBack) return;

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          ToastAndroid.show(
            t("workout.backNavigationDisabled"),
            ToastAndroid.SHORT,
          );
          return true;
        },
      );

      return () => subscription.remove();
    }, [preventBack, t]),
  );
}

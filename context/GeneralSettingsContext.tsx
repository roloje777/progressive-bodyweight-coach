import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  DEFAULT_GENERAL_SETTINGS,
  GeneralSettings,
  ThemePreference,
  loadGeneralSettings,
  restoreDefaultGeneralSettings,
  saveGeneralSettings,
} from "@/storage/generalSettingsStorage";

type GeneralSettingsContextValue = {
  generalSettings: GeneralSettings;
  isLoaded: boolean;
  setWeek1BaselineCoachEnabled: (enabled: boolean) => void;
  setPreventBackNavigationDuringWorkout: (enabled: boolean) => void;
  setThemePreference: (preference: ThemePreference) => void;
  restoreGeneralDefaults: () => void;
};

const GeneralSettingsContext = createContext<GeneralSettingsContextValue | null>(null);

export function GeneralSettingsProvider({ children }: { children: ReactNode }) {
  const [generalSettings, setGeneralSettings] = useState(DEFAULT_GENERAL_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadGeneralSettings().then((settings) => {
      if (!mounted) return;
      setGeneralSettings(settings);
      setIsLoaded(true);
    });
    return () => { mounted = false; };
  }, []);

  const update = (next: GeneralSettings) => {
    setGeneralSettings(next);
    void saveGeneralSettings(next);
  };

  const setWeek1BaselineCoachEnabled = (enabled: boolean) =>
    update({ ...generalSettings, week1BaselineCoachEnabled: enabled });

  const setPreventBackNavigationDuringWorkout = (enabled: boolean) =>
    update({ ...generalSettings, preventBackNavigationDuringWorkout: enabled });

  const setThemePreference = (preference: ThemePreference) =>
    update({ ...generalSettings, themePreference: preference });

  const restoreGeneralDefaults = () => {
    setGeneralSettings(DEFAULT_GENERAL_SETTINGS);
    void restoreDefaultGeneralSettings();
  };

  return (
    <GeneralSettingsContext.Provider value={{ generalSettings, isLoaded, setWeek1BaselineCoachEnabled, setPreventBackNavigationDuringWorkout, setThemePreference, restoreGeneralDefaults }}>
      {children}
    </GeneralSettingsContext.Provider>
  );
}

export function useGeneralSettings() {
  const value = useContext(GeneralSettingsContext);
  if (!value) throw new Error("useGeneralSettings must be used inside GeneralSettingsProvider");
  return value;
}

//data/defaultSettings.ts
import { AppSettings } from "../models/AppSettings";

export const defaultSettings: AppSettings = {
  overrideRest: false,

  customRestBetweenSets: 75,
  customRestBetweenExercises: 150,

  autoStartRest: false,
  enforceRest: false,

  coachEnabled: true,
};
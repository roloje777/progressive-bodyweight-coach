import { AppSettings } from "../models/AppSettings";

export const defaultSettings: AppSettings = {
  overrideRest: false,

  customRestBetweenSets: 60,
  customRestBetweenExercises: 90,

  autoStartRest: false,
  enforceRest: false,
};
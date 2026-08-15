//models/AppSettings.ts
export interface AppSettings {
  coachEnabled: boolean;
  overrideRest: boolean;

  customRestBetweenSets: number;
  customRestBetweenExercises: number;

  autoStartRest: boolean;
  enforceRest: boolean;
}
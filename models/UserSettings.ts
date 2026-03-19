// models/UserSettings.ts

export interface UserSettings {
  restBetweenSets?: number;
  restBetweenExercises?: number;
  getReadyCountdownSeconds?: number;
  countdownAlertThreshold?: number;
  playRestSound?: boolean;
  enableVibration?: boolean;

}
// utils/resolveConfig.ts

import { Program } from "../../models/Program";
import { UserSettings } from "../../models/UserSettings";

export function resolveConfig(
  program: Program,
  userSettings?: UserSettings,
) {
  return {
    restBetweenSets:
      userSettings?.restBetweenSets ??
      program.restBetweenSets ??
      20,

    restBetweenExercises:
      userSettings?.restBetweenExercises ??
      program.restBetweenExercises ??
      30,

    getReadyCountdownSeconds:
      userSettings?.getReadyCountdownSeconds ??
      program.getReadyCountdownSeconds ??
      3,

    countdownAlertThreshold:
      userSettings?.countdownAlertThreshold ??
      program.countdownAlertThreshold ??
      5,

    playRestSound:
      userSettings?.playRestSound ??
      program.playRestSound ??
      true,

    enableVibration:
    userSettings?.enableVibration ??
      program.enableVibration??
      true,
  };
}
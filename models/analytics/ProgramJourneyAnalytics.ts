import { ProgramLifecycleEvent } from "./ProgramLifecycleEvent";

export type ProgramJourneyAnalytics = {
  currentProgramId: string;
  currentWeekIndex: number;
  events: ProgramLifecycleEvent[];
};

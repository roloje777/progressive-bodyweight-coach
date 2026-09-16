import { DeloadReason } from "@/models/ProgramProgress";

export type ProgramLifecycleEventType =
  | "program-started"
  | "graduation-earned"
  | "graduated"
  | "repeat-week-started"
  | "maintenance-started"
  | "deload-triggered"
  | "deload-started"
  | "pain-recovery-started"
  | "verification-started"
  | "deload-cleared";

export type ProgramLifecycleEvent = {
  id: string;
  type: ProgramLifecycleEventType;
  programId: string;
  occurredAt: string;
  weekIndex?: number;
  nextProgramId?: string;
  deloadReason?: DeloadReason;
};

export type ProgramLifecycleEventInput = Omit<ProgramLifecycleEvent, "id">;

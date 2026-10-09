import { AbortAttempt, AbortReason, AbortStage } from "@/models/AbortAttempt";
import { saveAbortAttempt } from "@/storage/abortAttemptStorage";

type Input = { session: any; stage: AbortStage; reason: AbortReason; notes?: string;
  startWorkoutTime?: string | number; currentExercise?: any; currentSets?: any[];
  completed?: string[]; skipped?: string[]; plannedExercises?: any[]; engineExercises?: any[]; programId?: string; dayId?: string };
export async function recordAbortedWorkout(input: Input): Promise<AbortAttempt> {
  const {session, stage, reason, notes} = input;
  const now = Date.now();
  const start = Number(input.startWorkoutTime) || Number(session.startedAt) || now;
  const blocks: any[] = session.blocks ?? [];
  const workout = session.results?.workout ?? {};
  const previousExercises: any[] = [...(Array.isArray(workout.exercises) ? workout.exercises : []), ...(input.engineExercises ?? [])];
  const exerciseMap = new Map<string, {exerciseId:string; sets:unknown[]}>();
  for (const ex of previousExercises) {
    if (ex.exerciseId) exerciseMap.set(ex.exerciseId, {exerciseId:ex.exerciseId, sets:ex.sets ?? []});
  }
  // Preserve the live, unfinished exercise as well as previously completed exercises.
  const liveId = input.currentExercise?.exerciseId ?? input.currentExercise?.id;
  if (liveId && input.currentSets?.length) {
    if (!exerciseMap.has(liveId)) exerciseMap.set(liveId, {exerciseId:liveId, sets:input.currentSets});
  }
  const exercises = [...exerciseMap.values()];
  const mainBlocks = blocks.filter(b => b.type === "main");
  const prescribed = mainBlocks.flatMap(b => b.exercises ?? []);
  const plannedSets = prescribed.reduce((n: number, e: any) => n + Math.max(0, Number(e.sets) || 0), 0);
  const completedSets = exercises.reduce((n,e) => n + e.sets.filter((s:any) => !s?.skipped && s?.status !== "skipped").length, 0);
  const priorWarmup = session.results?.warmup ?? {};
  const priorStretch = session.results?.stretch ?? {};
  const completedWarmup = stage === "dynamicWarmUp" ? (input.completed ?? []) : (priorWarmup.completed ?? []);
  const completedStretch = stage === "staticStretch" ? (input.completed ?? []) : (priorStretch.completed ?? []);
  const skippedWarmup = stage === "dynamicWarmUp" ? (input.skipped ?? []) : (priorWarmup.skipped ?? []);
  const skippedStretch = stage === "staticStretch" ? (input.skipped ?? []) : (priorStretch.skipped ?? []);
  const attempt: AbortAttempt = {
    attemptId: `${now}-${Math.random().toString(36).slice(2,11)}`, reason, notes: notes?.trim() || undefined,
    stage, recordedAt: new Date(now).toISOString(),
    programId: String(session.programId ?? session.program?.id ?? input.programId ?? ""),
    dayId: String(session.dayId ?? session.day?.id ?? input.dayId ?? ""),
    weekIndex: session.weekIndex, dayIndex: session.dayIndex,
    trainingMode: session.trainingMode, workoutReason: session.workoutReason,
    startWorkoutTime:start, endWorkoutTime:now, durationSeconds:Math.max(0,Math.floor((now-start)/1000)),
    plannedSets, completedSets, completionPercent: plannedSets ? Math.min(100,Math.round(100*completedSets/plannedSets)) : 0,
    completedExercises:exercises, completedWarmup, completedStretch, skippedWarmup, skippedStretch,
  };
  await saveAbortAttempt(attempt);
  return attempt;
}

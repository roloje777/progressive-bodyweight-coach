import { exerciseRegistry } from "@/data/exerciseRegistry";
import { programs } from "@/data/programs";
import { ItemStatus } from "@/models/WorkoutStatus";
import { ProgramEvaluation } from "@/models/ProgramEvaluation";
import { ProgramReadinessReport } from "@/models/ProgramReadinessReport";
import { ProgramLifecycleEvent } from "@/models/analytics/ProgramLifecycleEvent";
import { CompletedExercise, CompletedSession, TrainingMode } from "@/models/WorkoutLog";
import { ProgressState, saveProgress } from "@/storage/progressStorage";
import { replaceWorkoutHistoryForDev } from "@/storage/workoutStorage";
import { replaceProgramEvaluationsForDev } from "@/storage/programEvaluationStorage";
import { replaceProgramLifecycleEventsForDev } from "@/storage/programLifecycleStorage";
import { AnalyticsScenarioId } from "./AnalyticsScenario";

type ScenarioPayload = {
  sessions: CompletedSession[];
  evaluations: ProgramEvaluation[];
  lifecycleEvents: ProgramLifecycleEvent[];
  progress: ProgressState;
};

type FeedbackSpec = { rating: number; tags: string[] };

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(daysAgo: number, hour = 9): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setTime(date.getTime() - daysAgo * DAY_MS);
  return date.toISOString();
}

function eventId(type: string, programId: string, weekIndex: number | undefined, daysAgo: number) {
  return `dev-${type}-${programId}-${weekIndex ?? "na"}-${daysAgo}`;
}

type LifecycleOptions = Pick<
  ProgramLifecycleEvent,
  "weekIndex" | "nextProgramId" | "deloadReason"
>;

function lifecycle(
  type: ProgramLifecycleEvent["type"],
  programId: string,
  daysAgo: number,
  options: Partial<LifecycleOptions> = {},
): ProgramLifecycleEvent {
  return {
    id: eventId(type, programId, options.weekIndex, daysAgo),
    type,
    programId,
    occurredAt: isoDaysAgo(daysAgo),
    ...options,
  };
}

function readinessReport(args: {
  score: number;
  mb: number;
  completion?: number;
  fatigue?: number;
  pain?: number;
  form?: number;
  difficulty?: number;
  recommendation?: "advance" | "repeat" | "deload";
  deloadReason?: "fatigue" | "pain" | "form" | "recovery" | null;
}): ProgramReadinessReport {
  const recommendation = args.recommendation ?? (args.score >= 100 ? "advance" : "repeat");
  return {
    readinessScore: args.score,
    mbSuccessRate: args.mb,
    completionRate: args.completion ?? 100,
    fatigueOccurrences: args.fatigue ?? 0,
    painOccurrences: args.pain ?? 0,
    formBreakdownOccurrences: args.form ?? 0,
    averageDifficulty: args.difficulty ?? 4,
    progressionBlocked: recommendation === "deload",
    progressionCandidate: recommendation === "advance",
    deloadCandidate: recommendation === "deload",
    deloadReason: args.deloadReason ?? null,
    recommendation,
    reasons: recommendation === "advance" ? ["Scenario: graduation criteria met"] : recommendation === "deload" ? ["Scenario: recovery intervention"] : ["Scenario: continue current progression"],
  };
}

function evaluation(programId: string, weekIndex: number, daysAgo: number, score: number, mb: number, extras: Partial<Parameters<typeof readinessReport>[0]> = {}): ProgramEvaluation {
  return {
    programId,
    weekIndex,
    weekNumber: weekIndex + 1,
    readinessReport: readinessReport({ score, mb, ...extras }),
    createdAt: isoDaysAgo(daysAgo, 18),
  };
}

function programExerciseIds(programIndex: number): string[] {
  const program = programs[programIndex] ?? programs[0];
  const ids = program.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId));
  return [...new Set(ids)].slice(0, 4);
}

function programHoldExerciseId(programIndex: number): string | null {
  const program = programs[programIndex] ?? programs[0];
  const ids = [...new Set(program.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId)))];
  return ids.find((exerciseId) => exerciseRegistry[exerciseId]?.type === "hold") ?? null;
}

function completedExercise(exerciseId: string, base: number, options: { excluded?: boolean; hold?: boolean; decline?: number; effortRating?: 1 | 2 | 3 } = {}): CompletedExercise {
  const delta = options.decline ?? 0;
  const values = [base, Math.max(1, base - 1 - delta), Math.max(1, base - 2 - delta)];
  return {
    exerciseId,
    effortRating: options.effortRating ?? 2,
    sets: values.map((value, index) => ({
      setNumber: index + 1,
      status: ItemStatus.Completed,
      ...(options.hold ? { durationSeconds: value * 5 } : { repsCompleted: value }),
      excludeFromProgression: options.excluded || undefined,
      prescribedRestBeforeSet: index === 0 ? undefined : 90,
      actualRestBeforeSet: index === 0 ? undefined : 90,
    })),
  };
}

function session(args: {
  programIndex: number;
  weekIndex: number;
  dayIndex: number;
  daysAgo: number;
  base: number;
  feedback?: FeedbackSpec;
  trainingMode?: TrainingMode;
  workoutReason?: "scheduled" | "repeat";
  excluded?: boolean;
  exerciseBases?: number[];
  effortRating?: 1 | 2 | 3;
}): CompletedSession {
  const program = programs[args.programIndex] ?? programs[0];
  const exerciseIds = programExerciseIds(args.programIndex);
  const completedAt = isoDaysAgo(args.daysAgo, 17);
  const end = Date.parse(completedAt);
  const start = end - 42 * 60 * 1000;
  return {
    programId: program.id,
    dayId: program.days[args.dayIndex % program.days.length]?.id ?? `day-${args.dayIndex + 1}`,
    weekIndex: args.weekIndex,
    dayIndex: args.dayIndex,
    completedAt,
    startWorkoutTime: start,
    endWorkoutTime: end,
    workoutDuration: 42 * 60,
    timeUnderTension: 420 + args.base * 6,
    workoutReason: args.workoutReason ?? "scheduled",
    trainingMode: args.trainingMode ?? "normal",
    feedback: args.feedback ?? { rating: 4, tags: ["good-pump"] },
    exercises: (() => {
      const repExercises = exerciseIds.slice(0, 3).map((exerciseId, index) =>
        completedExercise(exerciseId, args.exerciseBases?.[index] ?? Math.max(3, args.base - index), {
          excluded: args.excluded,
          effortRating: args.effortRating,
        }),
      );
      const holdExerciseId = programHoldExerciseId(args.programIndex);
      if (holdExerciseId && !repExercises.some((exercise) => exercise.exerciseId === holdExerciseId)) {
        repExercises.push(
          completedExercise(holdExerciseId, Math.max(5, args.base + 1), {
            excluded: args.excluded,
            hold: true,
            effortRating: args.effortRating,
          }),
        );
      }
      return repExercises;
    })(),
  };
}

function emptyProgress(programIndex = 0, week = 0, day = 0): ProgressState {
  return { programIndex, week, day, workouts: {}, pendingGraduation: null, activeRepeatWeek: null, activeDeload: null };
}

function healthyBlock(programIndex: number, weeks: number, startDaysAgo: number, startWeek = 0, base = 7) {
  const program = programs[programIndex] ?? programs[0];
  const sessions: CompletedSession[] = [];
  const evaluations: ProgramEvaluation[] = [];
  for (let offset = 0; offset < weeks; offset += 1) {
    const weekIndex = startWeek + offset;
    const weekDaysAgo = startDaysAgo - offset * 7;
    const workoutCount = Math.min(program.days.length, 4);
    for (let dayIndex = 0; dayIndex < workoutCount; dayIndex += 1) {
      sessions.push(session({ programIndex, weekIndex, dayIndex, daysAgo: weekDaysAgo - dayIndex, base: base + offset, effortRating: offset <= 1 ? 3 : offset === 2 ? 2 : 1 }));
    }
    evaluations.push(evaluation(program.id, weekIndex, Math.max(0, weekDaysAgo - workoutCount), 50 + offset * 15, 62 + offset * 8));
  }
  return { sessions, evaluations };
}

function buildScenario(id: AnalyticsScenarioId): ScenarioPayload {
  const p0 = programs[0];
  const p1 = programs[1] ?? programs[0];

  if (id === "fresh-install") {
    return { sessions: [], evaluations: [], lifecycleEvents: [], progress: emptyProgress(0, 0, 0) };
  }

  if (id === "normal-progression") {
    const finalWeekIndex = p0.weeks - 1;
    const block = healthyBlock(0, p0.weeks, Math.max(27, p0.weeks * 7 - 1), 0, 7);
    block.evaluations[finalWeekIndex] = evaluation(
      p0.id,
      finalWeekIndex,
      1,
      100,
      88,
      { recommendation: "advance" },
    );
    return {
      ...block,
      lifecycleEvents: [
        lifecycle("program-started", p0.id, Math.max(31, p0.weeks * 7 + 3), { weekIndex: 0 }),
        lifecycle("graduation-earned", p0.id, 1, { weekIndex: finalWeekIndex, nextProgramId: p1.id }),
      ],
      progress: emptyProgress(0, finalWeekIndex, 0),
    };
  }

  if (id === "plateau") {
    const sessions: CompletedSession[] = [];
    const evaluations: ProgramEvaluation[] = [];
    for (let w = 0; w < 5; w += 1) {
      const daysAgo = 34 - w * 7;
      for (let d = 0; d < Math.min(p0.days.length, 4); d += 1) sessions.push(session({ programIndex: 0, weekIndex: w, dayIndex: d, daysAgo: daysAgo - d, base: 9 }));
      evaluations.push(evaluation(p0.id, w, Math.max(0, daysAgo - 4), 60, 72));
    }
    return { sessions, evaluations, lifecycleEvents: [lifecycle("program-started", p0.id, 40, { weekIndex: 0 })], progress: emptyProgress(0, 4, 0) };
  }

  if (id === "fatigue-deload-recovery") {
    const sessions: CompletedSession[] = [
      session({ programIndex: 0, weekIndex: 0, dayIndex: 0, daysAgo: 42, base: 10 }),
      session({ programIndex: 0, weekIndex: 0, dayIndex: 1, daysAgo: 40, base: 10 }),
      session({ programIndex: 0, weekIndex: 1, dayIndex: 0, daysAgo: 34, base: 9, feedback: { rating: 3, tags: ["low-energy"] } }),
      session({ programIndex: 0, weekIndex: 1, dayIndex: 1, daysAgo: 32, base: 8, feedback: { rating: 2, tags: ["low-energy", "form-breakdown"] } }),
      session({ programIndex: 0, weekIndex: 2, dayIndex: 0, daysAgo: 24, base: 6, trainingMode: "deload-fatigue", feedback: { rating: 3, tags: ["perfect-difficulty"] } }),
      session({ programIndex: 0, weekIndex: 2, dayIndex: 1, daysAgo: 22, base: 6, trainingMode: "deload-fatigue", feedback: { rating: 4, tags: ["great-focus"] } }),
      session({ programIndex: 0, weekIndex: 3, dayIndex: 0, daysAgo: 14, base: 9, trainingMode: "verification", feedback: { rating: 4, tags: ["good-pump"] } }),
      session({ programIndex: 0, weekIndex: 3, dayIndex: 1, daysAgo: 12, base: 10, trainingMode: "verification", feedback: { rating: 4, tags: ["great-focus"] } }),
    ];
    const evaluations = [
      evaluation(p0.id, 0, 38, 60, 84),
      evaluation(p0.id, 1, 30, 0, 48, { fatigue: 2, form: 1, recommendation: "deload", deloadReason: "fatigue", difficulty: 2.8 }),
      evaluation(p0.id, 3, 10, 60, 82),
    ];
    const lifecycleEvents = [
      lifecycle("program-started", p0.id, 48, { weekIndex: 0 }),
      lifecycle("deload-triggered", p0.id, 30, { weekIndex: 1, deloadReason: "fatigue" }),
      lifecycle("deload-started", p0.id, 25, { weekIndex: 2, deloadReason: "fatigue" }),
      lifecycle("verification-started", p0.id, 15, { weekIndex: 3, deloadReason: "fatigue" }),
      lifecycle("deload-cleared", p0.id, 9, { weekIndex: 3, deloadReason: "fatigue" }),
    ];
    return { sessions, evaluations, lifecycleEvents, progress: emptyProgress(0, 4, 0) };
  }

  if (id === "pain-recovery") {
    const sessions: CompletedSession[] = [
      session({ programIndex: 0, weekIndex: 0, dayIndex: 0, daysAgo: 30, base: 9 }),
      session({ programIndex: 0, weekIndex: 0, dayIndex: 1, daysAgo: 28, base: 9, feedback: { rating: 2, tags: ["joint-discomfort"] }, excluded: true }),
      session({ programIndex: 0, weekIndex: 1, dayIndex: 0, daysAgo: 21, base: 4, trainingMode: "deload-pain", feedback: { rating: 3, tags: ["perfect-difficulty"] }, excluded: true }),
      session({ programIndex: 0, weekIndex: 1, dayIndex: 1, daysAgo: 18, base: 4, trainingMode: "deload-pain", feedback: { rating: 4, tags: ["great-focus"] }, excluded: true }),
      session({ programIndex: 0, weekIndex: 2, dayIndex: 0, daysAgo: 10, base: 8, trainingMode: "verification", feedback: { rating: 4, tags: ["good-pump"] } }),
      session({ programIndex: 0, weekIndex: 2, dayIndex: 1, daysAgo: 8, base: 9, trainingMode: "verification", feedback: { rating: 4, tags: ["great-focus"] } }),
    ];
    return {
      sessions,
      evaluations: [evaluation(p0.id, 0, 27, 0, 55, { pain: 1, recommendation: "deload", deloadReason: "pain" }), evaluation(p0.id, 2, 7, 60, 80)],
      lifecycleEvents: [lifecycle("program-started", p0.id, 35, { weekIndex: 0 }), lifecycle("pain-recovery-started", p0.id, 27, { weekIndex: 0, deloadReason: "pain" }), lifecycle("deload-started", p0.id, 22, { weekIndex: 1, deloadReason: "pain" }), lifecycle("verification-started", p0.id, 11, { weekIndex: 2, deloadReason: "pain" }), lifecycle("deload-cleared", p0.id, 7, { weekIndex: 2, deloadReason: "pain" })],
      progress: emptyProgress(0, 3, 0),
    };
  }

  if (id === "repeat-week") {
    const finalWeekIndex = p0.weeks - 1;
    const repeatWeekIndex = p0.weeks;
    const block = healthyBlock(0, p0.weeks + 1, Math.max(34, (p0.weeks + 1) * 7), 0, 7);
    block.evaluations[finalWeekIndex] = evaluation(
      p0.id,
      finalWeekIndex,
      14,
      100,
      88,
      { recommendation: "advance" },
    );
    block.evaluations[repeatWeekIndex] = evaluation(
      p0.id,
      repeatWeekIndex,
      2,
      100,
      92,
      { recommendation: "advance" },
    );
    block.sessions
      .filter((s) => s.weekIndex === repeatWeekIndex)
      .forEach((s) => { s.workoutReason = "repeat"; });

    return {
      ...block,
      lifecycleEvents: [
        lifecycle("program-started", p0.id, Math.max(40, (p0.weeks + 1) * 7 + 5), { weekIndex: 0 }),
        lifecycle("graduation-earned", p0.id, 14, { weekIndex: finalWeekIndex, nextProgramId: p1.id }),
        lifecycle("repeat-week-started", p0.id, 13, { weekIndex: repeatWeekIndex }),
        lifecycle("graduation-earned", p0.id, 2, { weekIndex: repeatWeekIndex, nextProgramId: p1.id }),
      ],
      progress: emptyProgress(0, repeatWeekIndex, 0),
    };
  }

  if (id === "graduation") {
    const finalWeekIndex = p0.weeks - 1;
    const first = healthyBlock(0, p0.weeks, Math.max(45, p0.weeks * 7 + 3), 0, 7);
    first.evaluations[finalWeekIndex] = evaluation(
      p0.id,
      finalWeekIndex,
      18,
      100,
      90,
      { recommendation: "advance" },
    );
    const nextIndex = programs[1] ? 1 : 0;
    const second = healthyBlock(nextIndex, 2, 12, 0, 8);
    return {
      sessions: [...first.sessions, ...second.sessions],
      evaluations: [...first.evaluations, ...second.evaluations],
      lifecycleEvents: [
        lifecycle("program-started", p0.id, Math.max(52, p0.weeks * 7 + 10), { weekIndex: 0 }),
        lifecycle("graduation-earned", p0.id, 18, { weekIndex: finalWeekIndex, nextProgramId: p1.id }),
        lifecycle("graduated", p0.id, 17, { weekIndex: finalWeekIndex, nextProgramId: p1.id }),
        lifecycle("program-started", p1.id, 17, { weekIndex: 0 }),
      ],
      progress: emptyProgress(nextIndex, 1, 0),
    };
  }

  if (id === "mixed-exercises") {
    const sessions: CompletedSession[] = [];
    const ids = programExerciseIds(0);
    for (let w = 0; w < 6; w += 1) {
      const daysAgo = 41 - w * 7;
      const s = session({ programIndex: 0, weekIndex: w, dayIndex: 0, daysAgo, base: 8, exerciseBases: [7 + w, 10, 14 - w] });
      if (ids.length >= 3) {
        s.exercises = [completedExercise(ids[0], 7 + w), completedExercise(ids[1], 10), completedExercise(ids[2], 14 - w)];
        const holdExerciseId = programHoldExerciseId(0);
        if (holdExerciseId) s.exercises.push(completedExercise(holdExerciseId, 6 + w, { hold: true }));
      }
      sessions.push(s);
    }
    return { sessions, evaluations: Array.from({ length: 6 }, (_, w) => evaluation(p0.id, w, 40 - w * 7, 50 + Math.min(3, w) * 10, 70)), lifecycleEvents: [lifecycle("program-started", p0.id, 48, { weekIndex: 0 })], progress: emptyProgress(0, 5, 0) };
  }

  if (id === "inconsistent-adherence") {
    const sessions: CompletedSession[] = [];
    const evaluations: ProgramEvaluation[] = [];
    const expected = Math.min(p0.days.length, 4);
    for (let w = 0; w < 4; w += 1) {
      const daysAgo = 27 - w * 7;
      const completedDays = w === 1 ? Math.max(1, expected - 2) : w === 2 ? Math.max(1, expected - 1) : expected;
      for (let d = 0; d < completedDays; d += 1) {
        sessions.push(session({ programIndex: 0, weekIndex: w, dayIndex: d, daysAgo: daysAgo - d, base: 8 + w }));
      }
      evaluations.push(evaluation(p0.id, w, Math.max(0, daysAgo - expected), 50 + w * 10, 68 + w * 4, { completion: Math.round((completedDays / expected) * 100) }));
    }
    return { sessions, evaluations, lifecycleEvents: [lifecycle("program-started", p0.id, 34, { weekIndex: 0 })], progress: emptyProgress(0, 3, 0) };
  }

  if (id === "mb-stress-test") {
    const sessions: CompletedSession[] = [
      session({ programIndex: 0, weekIndex: 0, dayIndex: 0, daysAgo: 34, base: 8 }),
      session({ programIndex: 0, weekIndex: 1, dayIndex: 0, daysAgo: 27, base: 10 }),
      session({ programIndex: 0, weekIndex: 2, dayIndex: 0, daysAgo: 20, base: 10 }),
      session({ programIndex: 0, weekIndex: 3, dayIndex: 0, daysAgo: 13, base: 7 }),
      session({ programIndex: 0, weekIndex: 4, dayIndex: 0, daysAgo: 6, base: 6, feedback: { rating: 2, tags: ["low-energy"] }, excluded: true }),
    ];
    return {
      sessions,
      evaluations: [
        evaluation(p0.id, 0, 33, 50, 65),
        evaluation(p0.id, 1, 26, 60, 88),
        evaluation(p0.id, 2, 19, 60, 82),
        evaluation(p0.id, 3, 12, 50, 45),
        evaluation(p0.id, 4, 5, 25, 40, { fatigue: 1 }),
      ],
      lifecycleEvents: [lifecycle("program-started", p0.id, 40, { weekIndex: 0 })],
      progress: emptyProgress(0, 4, 0),
    };
  }

  // Long-term: deliberately populate all date windows while preserving a ~1-year journey.
  const sessions: CompletedSession[] = [];
  const evaluations: ProgramEvaluation[] = [];
  const lifecycleEvents: ProgramLifecycleEvent[] = [];
  const programCount = Math.min(programs.length, 3);
  const starts = programCount >= 3 ? [350, 190, 77] : programCount === 2 ? [350, 77] : [77];
  const weekCounts = programCount >= 3 ? [8, 8, 12] : programCount === 2 ? [8, 12] : [12];

  for (let pi = 0; pi < programCount; pi += 1) {
    const program = programs[pi];
    const startDaysAgo = starts[pi];
    const weeks = weekCounts[pi];
    lifecycleEvents.push(lifecycle("program-started", program.id, startDaysAgo + 3, { weekIndex: 0 }));

    for (let w = 0; w < weeks; w += 1) {
      const weekDaysAgo = Math.max(0, startDaysAgo - w * 7);
      for (let d = 0; d < Math.min(program.days.length, 4); d += 1) {
        sessions.push(
          session({
            programIndex: pi,
            weekIndex: w,
            dayIndex: d,
            daysAgo: Math.max(0, weekDaysAgo - d),
            base: 6 + pi * 2 + Math.floor(w / 2),
            feedback: w === 5 && pi === 1 ? { rating: 3, tags: ["low-energy"] } : undefined,
          }),
        );
      }
      evaluations.push(
        evaluation(
          program.id,
          w,
          Math.max(0, weekDaysAgo - 4),
          w === weeks - 1 && pi < programCount - 1 ? 100 : Math.min(90, 50 + w * 5),
          Math.min(94, 64 + w * 3),
        ),
      );
    }

    if (pi < programCount - 1) {
      const next = programs[pi + 1];
      const graduationDaysAgo = Math.max(0, startDaysAgo - (weeks - 1) * 7 - 5);
      lifecycleEvents.push(
        lifecycle("graduation-earned", program.id, graduationDaysAgo + 1, {
          weekIndex: weeks - 1,
          nextProgramId: next.id,
        }),
      );
      lifecycleEvents.push(
        lifecycle("graduated", program.id, graduationDaysAgo, {
          weekIndex: weeks - 1,
          nextProgramId: next.id,
        }),
      );
    }
  }

  return {
    sessions,
    evaluations,
    lifecycleEvents,
    progress: emptyProgress(programCount - 1, weekCounts[programCount - 1] - 1, 0),
  };
}

export async function seedAnalyticsScenario(id: AnalyticsScenarioId): Promise<void> {
  if (!__DEV__) return;
  const payload = buildScenario(id);
  await Promise.all([
    replaceWorkoutHistoryForDev(payload.sessions),
    replaceProgramEvaluationsForDev(payload.evaluations),
    replaceProgramLifecycleEventsForDev(payload.lifecycleEvents),
    saveProgress(payload.progress),
  ]);
}

import type { CompletedSession } from "@/models/WorkoutLog";
import { programs } from "@/data/programs";
import { getWorkoutStatusPresentation, type WorkoutStatusTone } from "@/utils/workoutPresentation";
import { abortReasonLabel, abortStageLabel } from "@/utils/abortPresentation";
import { exportWorkoutReport, type WorkoutExportFormat } from "@/utils/workoutExport";

export type WorkoutHistoryCategory = "all" | WorkoutStatusTone;

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const categoryNames: Record<WorkoutHistoryCategory, { en: string; pt: string }> = {
  all: { en: "All", pt: "Tudo" }, normal: { en: "Normal", pt: "Normal" },
  aborted: { en: "Aborted", pt: "Interrompido" },
  deload: { en: "Deload", pt: "Deload" },
  verification: { en: "Verification", pt: "Verificação" },
  recovery: { en: "Pain Recovery", pt: "Recuperação da dor" },
  repeat: { en: "Repeat", pt: "Repetição" },
  maintenance: { en: "Maintenance", pt: "Manutenção" },
};

export function workoutHistoryCategory(session: CompletedSession): WorkoutStatusTone {
  const program = programs.find(p => p.id === session.programId);
  return getWorkoutStatusPresentation(session, program).tone;
}

/** Summary only: individual workout details and their existing export remain unchanged. */
export function buildWorkoutHistorySummaryReport(
  sessions: CompletedSession[], category: WorkoutHistoryCategory, pt: boolean,
) {
  const locale = pt ? "pt-PT" : "en-GB";
  const selected = sessions.filter(s => category === "all" || workoutHistoryCategory(s) === category)
    .slice().sort((a, b) => b.endWorkoutTime - a.endWorkoutTime);
  const title = pt ? "Resumo do histórico de treinos" : "Workout History Summary";
  const categoryName = categoryNames[category][pt ? "pt" : "en"];
  const subtitle = `${pt ? "Categoria" : "Category"}: ${categoryName} · ${pt ? "Treinos" : "Workouts"}: ${selected.length}`;
  const lines = selected.map(s => {
    const program = programs.find(p => p.id === s.programId);
    const day = program?.days.find(d => d.id === s.dayId);
    const status = workoutHistoryCategory(s);
    const timestamp = Number.isFinite(s.endWorkoutTime) && s.endWorkoutTime > 0
      ? new Date(s.endWorkoutTime).toLocaleString(locale)
      : (pt ? "Data indisponível" : "Date unavailable");
    const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
    const duration = Math.max(0, Math.floor((s.workoutDuration || 0) / 60));
    const heading = `${timestamp} — ${program?.name ?? s.programId} / ${day?.title ?? s.dayId}`;
    const details = [
      `${pt ? "Estado" : "Status"}: ${categoryNames[status][pt ? "pt" : "en"]}`,
      `${pt ? "Semana" : "Week"}: ${s.weekIndex == null ? "—" : s.weekIndex + 1} · ${pt ? "Dia" : "Day"}: ${s.dayIndex == null ? "—" : s.dayIndex + 1}`,
      `${pt ? "Exercícios" : "Exercises"}: ${s.exercises.length} · ${pt ? "Séries registadas" : "Recorded sets"}: ${sets}`,
      `${pt ? "Duração" : "Duration"}: ${duration} min`,
    ];
    if (s.abortAttempt) {
      details.push(`${pt ? "Motivo da interrupção" : "Abort reason"}: ${abortReasonLabel(s.abortAttempt.reason, locale)}`);
      details.push(`${pt ? "Etapa" : "Stage"}: ${abortStageLabel(s.abortAttempt.stage, locale)}`);
      details.push(`${pt ? "Conclusão" : "Completion"}: ${s.abortAttempt.completionPercent}%`);
    }
    return { heading, details };
  });
  const text = [title, subtitle, "", ...lines.flatMap(l => [l.heading, ...l.details, ""])].join("\n");
  const html = `<!doctype html><html lang="${pt ? "pt-PT" : "en"}"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width,initial-scale=1" />` +
    `<title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#20242a;line-height:1.5;margin:30px}` +
    `h1{font-size:24px}h2{font-size:16px}section{border-top:1px solid #bbb;padding:12px 0;break-inside:avoid}` +
    `li{margin:3px 0;overflow-wrap:anywhere}</style></head><body><h1>${escapeHtml(title)}</h1>` +
    `<p>${escapeHtml(subtitle)}</p>` + lines.map(l => `<section><h2>${escapeHtml(l.heading)}</h2><ul>` +
      l.details.map(d => `<li>${escapeHtml(d)}</li>`).join("") + `</ul></section>`).join("") + `</body></html>`;
  return { title, subtitle, text, html,
    filenameBase: `pbh-workout-history-${category}-${new Date().toISOString().slice(0, 10)}` };
}

export async function exportWorkoutHistorySummary(
  sessions: CompletedSession[], category: WorkoutHistoryCategory, pt: boolean, format: WorkoutExportFormat,
) {
  await exportWorkoutReport(buildWorkoutHistorySummaryReport(sessions, category, pt), format);
}

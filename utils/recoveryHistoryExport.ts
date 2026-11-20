import { exportWorkoutReport, type WorkoutExportFormat } from "@/utils/workoutExport";

export type RecoveryExportEntry = {
  id: string;
  kind: "abort" | "triage" | "pain-week" | "medical";
  time: number;
  title: string;
  summary: string;
  details: string[];
  privateDetails?: string[];
};

export type RecoveryExportScope = "all" | RecoveryExportEntry["kind"];

const escapeHtml = (value: string): string => value
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");

export function buildRecoveryHistoryReport(
  records: RecoveryExportEntry[],
  scope: RecoveryExportScope,
  includePrivate: boolean,
  pt: boolean,
) {
  const selected = records.filter(r => scope === "all" || r.kind === scope)
    .sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
  const title = pt ? "Histórico de dor e recuperação" : "Pain & Recovery History";
  const categoryNames: Record<RecoveryExportScope, string> = pt
    ? { all: "Tudo", abort: "Interrupções", triage: "Coach de Dor", "pain-week": "Semana de Dor", medical: "Médico" }
    : { all: "All", abort: "Aborts", triage: "Pain Coach", "pain-week": "Pain Week", medical: "Medical" };
  const subtitle = `${pt ? "Categoria" : "Category"}: ${categoryNames[scope]} · ${pt ? "Registos" : "Records"}: ${selected.length}`;
  const notice = pt
    ? "Privacidade: este documento pode conter dados de saúde pessoais. Guarde e partilhe com cuidado."
    : "Privacy: this document may contain personal health information. Store and share carefully.";
  const privacy = includePrivate
    ? (pt ? "Tratamento e notas médicas privadas incluídos por opção explícita." : "Private medical treatment and notes included by explicit choice.")
    : (pt ? "Tratamento e notas médicas privadas excluídos." : "Private medical treatment and notes excluded.");
  const formatDate = (time: number) => time > 0
    ? new Date(time).toLocaleString(pt ? "pt-PT" : "en-GB")
    : (pt ? "Data indisponível" : "Date unavailable");
  const sections = selected.map(r => ({
    heading: r.title,
    date: formatDate(r.time),
    summary: r.summary,
    lines: [...r.details, ...(includePrivate ? r.privateDetails ?? [] : [])],
  }));
  const text = [title, subtitle, privacy, notice, "", ...sections.flatMap(s => [
    s.heading, s.date, s.summary, ...s.lines, "",
  ])].join("\n");
  const html = `<!doctype html><html lang="${pt ? "pt-PT" : "en"}"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#20242a;line-height:1.5;margin:30px}` +
    `h1{font-size:24px}h2{font-size:17px;margin-bottom:4px}section{break-inside:avoid;border-top:1px solid #bbb;padding:12px 0}` +
    `.muted{color:#555}.notice{padding:10px;border:1px solid #888}li{margin:3px 0;overflow-wrap:anywhere}</style></head><body>` +
    `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>` +
    `<p class="notice">${escapeHtml(privacy)} ${escapeHtml(notice)}</p>` +
    sections.map(s => `<section><h2>${escapeHtml(s.heading)}</h2><div class="muted">${escapeHtml(s.date)}</div>` +
      `<p>${escapeHtml(s.summary)}</p><ul>${s.lines.map(line => `<li>${escapeHtml(line)}</li>`).join("")}</ul></section>`).join("") +
    `</body></html>`;
  const filenameBase = `pbh-recovery-history-${scope}-${new Date().toISOString().slice(0, 10)}`;
  return { filenameBase, title, subtitle, text, html };
}

export async function exportRecoveryHistory(
  records: RecoveryExportEntry[], scope: RecoveryExportScope,
  includePrivate: boolean, pt: boolean, format: WorkoutExportFormat,
): Promise<void> {
  await exportWorkoutReport(buildRecoveryHistoryReport(records, scope, includePrivate, pt), format);
}

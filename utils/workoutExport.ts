import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type WorkoutExportFormat = "txt" | "html" | "pdf";

export type WorkoutExportReport = {
  filenameBase: string;
  title: string;
  subtitle: string;
  text: string;
  html: string;
};

const MIME_TYPES: Record<Exclude<WorkoutExportFormat, "pdf">, string> = {
  txt: "text/plain",
  html: "text/html",
};

async function ensureSharingAvailable() {
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error("File sharing is not available on this device.");
  }
}

export async function exportWorkoutReport(
  report: WorkoutExportReport,
  format: WorkoutExportFormat,
) {
  await ensureSharingAvailable();

  if (format === "pdf") {
    const { uri } = await Print.printToFileAsync({ html: report.html });

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Export workout as PDF",
      UTI: ".pdf",
    });

    return;
  }

  if (!FileSystem.cacheDirectory) {
    throw new Error("Unable to access the app cache directory.");
  }

  const extension = format;
  const uri = `${FileSystem.cacheDirectory}${report.filenameBase}.${extension}`;
  const contents = format === "html" ? report.html : report.text;

  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(uri, {
    mimeType: MIME_TYPES[format],
    dialogTitle: `Export workout as ${format.toUpperCase()}`,
    UTI: format === "html" ? "public.html" : "public.plain-text",
  });
}

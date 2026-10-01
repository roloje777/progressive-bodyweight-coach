import type { SupportedLanguage } from "@/i18n";

/**
 * Language-specific exercise-guide video overrides.
 *
 * Only add a URL here after the video has been manually verified to:
 *  - demonstrate the same exercise/variation used by PBH; and
 *  - be presented in Portuguese (pt-PT preferred, pt-BR acceptable).
 *
 * Missing entries deliberately fall back to the existing English guide URL.
 */
const ptPTVideoUrls: Record<string, string> = {
  // Portuguese (Portugal)
  "inverted-rows": "https://www.youtube.com/watch?v=oHIHJmNPncc",

  // Portuguese (Brazil)
  "standard-push-ups": "https://www.youtube.com/watch?v=ZlYOc8vD8E8",
  "push-ups": "https://www.youtube.com/watch?v=ZlYOc8vD8E8",
  "pull-ups": "https://www.youtube.com/watch?v=amNlgdkzbcM",
  "glute-stretches": "https://www.youtube.com/watch?v=nFjymuwVZ78",
  "calf-stretches": "https://www.youtube.com/watch?v=zWKZO-SSIic",
};

export function getExerciseGuideVideoUrl(
  exerciseId: string,
  language: SupportedLanguage,
  fallbackUrl?: string,
): string {
  if (language === "pt-PT") {
    return ptPTVideoUrls[exerciseId] ?? fallbackUrl ?? "";
  }

  return fallbackUrl ?? "";
}

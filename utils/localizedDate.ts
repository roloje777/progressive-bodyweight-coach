import type { SupportedLanguage } from "@/i18n";

export function localeForLanguage(language: SupportedLanguage): string {
  return language === "pt-PT" ? "pt-PT" : "en-GB";
}

export function formatLocalizedDate(value: string | number | Date, language: SupportedLanguage, options: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(localeForLanguage(language), options);
}

export function formatLocalizedTime(value: string | number | Date, language: SupportedLanguage, options: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleTimeString(localeForLanguage(language), options);
}

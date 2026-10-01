import en from "./locales/en";
import ptPT from "./locales/pt-PT";

export type SupportedLanguage = "en" | "pt-PT";
export type LanguagePreference = "system" | SupportedLanguage;

const resources = { en, "pt-PT": ptPT } as const;
export type TranslationKey = keyof typeof en;

export function getSystemLanguage(): SupportedLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale === "pt-pt" || locale.startsWith("pt-pt-")) return "pt-PT";
  } catch {
    // Fall through to English when the runtime cannot expose a locale.
  }
  return "en";
}

export function resolveLanguage(preference: LanguagePreference): SupportedLanguage {
  return preference === "system" ? getSystemLanguage() : preference;
}

export type TranslationParams = Record<string, string | number>;

export function translate(
  language: SupportedLanguage,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const template = resources[language][key] ?? resources.en[key] ?? key;
  if (!params) return template;

  return Object.entries(params).reduce<string>(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    String(template),
  );
}

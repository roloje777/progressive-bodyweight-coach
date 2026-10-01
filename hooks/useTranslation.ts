import { useMemo } from "react";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { resolveLanguage, translate, TranslationKey, TranslationParams } from "@/i18n";
import { localizeExerciseName, localizeWorkoutTitle, localizeHypertrophyLevel, localizeExerciseType, localizeUiText } from "@/i18n/presentation";

export function useTranslation() {
  const { generalSettings } = useGeneralSettings();
  const language = resolveLanguage(generalSettings.languagePreference);

  return useMemo(
    () => ({
      language,
      t: (key: TranslationKey, params?: TranslationParams) => translate(language, key, params),
      exerciseName: (exerciseId: string | undefined, fallback: string) => localizeExerciseName(language, exerciseId, fallback),
      workoutTitle: (title: string) => localizeWorkoutTitle(language, title),
      hypertrophyLevel: (label: string) => localizeHypertrophyLevel(language, label),
      exerciseType: (type: string) => localizeExerciseType(language, type),
      uiText: (text: string) => localizeUiText(language, text),
    }),
    [language],
  );
}

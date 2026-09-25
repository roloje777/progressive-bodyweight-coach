import { useColorScheme } from "@/hooks/use-color-scheme";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";

export type ResolvedAppTheme = "light" | "dark";

export function useAppTheme(): ResolvedAppTheme {
  const systemScheme = useColorScheme();
  const { generalSettings } = useGeneralSettings();

  if (generalSettings.themePreference === "light") return "light";
  if (generalSettings.themePreference === "dark") return "dark";
  return systemScheme === "dark" ? "dark" : "light";
}

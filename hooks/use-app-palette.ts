import { useAppTheme } from "@/hooks/use-app-theme";

export type AppPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  disabled: string;
  primary: string;
  primaryText: string;
  accent: string;
  danger: string;
  info: string;
  shadow: string;
};

const palettes: Record<"light" | "dark", AppPalette> = {
  dark: {
    background: "#111111",
    surface: "#222222",
    surfaceAlt: "#333333",
    surfaceElevated: "#1C1C1C",
    text: "#FFFFFF",
    textMuted: "#AAAAAA",
    border: "#555555",
    disabled: "#555555",
    primary: "#FFD700",
    primaryText: "#111111",
    accent: "#4CAF50",
    danger: "#FF3B30",
    info: "#4FC3F7",
    shadow: "#000000",
  },
  light: {
    background: "#F6F7F8",
    surface: "#FFFFFF",
    surfaceAlt: "#E8EBED",
    surfaceElevated: "#FFFFFF",
    text: "#11181C",
    textMuted: "#5F6B73",
    border: "#C8CFD4",
    disabled: "#AAB2B8",
    primary: "#8A6500",
    primaryText: "#FFFFFF",
    accent: "#2E7D32",
    danger: "#C62828",
    info: "#0277BD",
    shadow: "#000000",
  },
};

export function useAppPalette(): AppPalette {
  return palettes[useAppTheme()];
}

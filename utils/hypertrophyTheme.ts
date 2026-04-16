import { Ionicons } from "@expo/vector-icons";
type IconName = keyof typeof Ionicons.glyphMap;

// export function getLevel(value: number): {
//   label: string;
//   icon: IconName;
// } {
//   if (value <= 1.5) return { label: "Very Low", icon: "leaf" };
//   if (value <= 2.5) return { label: "Low", icon: "arrow-down" };
//   if (value <= 3.5) return { label: "Moderate", icon: "remove" };
//   if (value <= 4.5) return { label: "High", icon: "arrow-up" };
//   return { label: "Extreme", icon: "flame" };
// }


// export function getColor(value: number) {
//   if (value <= 1.5) return "#4CAF50"; // green
//   if (value <= 2.5) return "#8BC34A"; // light green
//   if (value <= 3.5) return "#FFC107"; // yellow
//   if (value <= 4.5) return "#FF9800"; // orange
//   return "#FF3B30"; // red
// }

type HypertrophyLevel = {
  label: string;
  color: string;
  icon: IconName;
};

export function getHypertrophyLevel(value: number): HypertrophyLevel {
  if (value <= 1.5) return { label: "Very Low", color: "#4CAF50", icon: "leaf" };
  if (value <= 2.5) return { label: "Low", color: "#8BC34A", icon: "arrow-down" };
  if (value <= 3.5) return { label: "Moderate", color: "#FFC107", icon: "remove" };
  if (value <= 4.5) return { label: "High", color: "#FF9800", icon: "arrow-up" };
  return { label: "Extreme", color: "#FF3B30", icon: "flame" };
}

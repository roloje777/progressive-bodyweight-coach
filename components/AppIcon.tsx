import { Ionicons } from "@expo/vector-icons";
import { useAppPalette } from "@/hooks/use-app-palette";
import { appTokens } from "@/styles/appStyles";

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  size?: "small" | "medium" | "large";
  color?: string;
};

export default function AppIcon({
  name,
  size = "small",
  color,
}: Props) {
  const palette = useAppPalette();
  const resolvedColor = color ?? palette.primary;
  return (
    <Ionicons
      name={name}
      size={appTokens.iconSizes[size]}
      color={resolvedColor}
    />
  );
}
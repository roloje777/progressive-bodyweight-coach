import { Ionicons } from "@expo/vector-icons";
import { appTokens } from "@/styles/appStyles";

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  size?: "small" | "medium" | "large";
  color?: string;
};

export default function AppIcon({
  name,
  size = "small",
  color = appTokens.colors.primary,
}: Props) {
  return (
    <Ionicons
      name={name}
      size={appTokens.iconSizes[size]}
      color={color}
    />
  );
}
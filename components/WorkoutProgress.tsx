import React from "react";
import { View, Text } from "react-native";
import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { ItemStatus } from "@/models/WorkoutStatus";
import { useTranslation } from "@/hooks/useTranslation";

type Block = {
  id: string;
  title: string;
  status: ItemStatus;
};

type Props = {
  blocks: Block[];
};

function getIcon(status: ItemStatus) {
  switch (status) {
    case ItemStatus.Completed:
      return "✓";

    case ItemStatus.InProgress:
      return "▶";

    default:
      return "○";
  }
}

export default function WorkoutProgress({ blocks }: Props) {
  const appStyles = useAppStyles();
  const palette = useAppPalette();
  const { workoutTitle } = useTranslation();

  const translateBlockTitle = (title: string) => workoutTitle(title);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        width: "100%",
        paddingHorizontal: 4,
        gap: 6,
      }}
    >
      {blocks.map((block) => (
        <View
          key={block.id}
          style={{
            alignItems: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Text
            style={{
              color: palette.primary,
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {getIcon(block.status)}
          </Text>

          <Text
            style={{
              color: palette.text,
              fontSize: 12,
              marginTop: 2,
              textAlign: "center",
              width: "100%",
            }}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {translateBlockTitle(block.title)}
          </Text>
        </View>
      ))}
    </View>
  );
}

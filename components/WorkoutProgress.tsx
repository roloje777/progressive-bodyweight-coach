import React from "react";
import { View, Text } from "react-native";
import { useAppStyles } from "@/styles/appStyles";
import { useAppPalette } from "@/hooks/use-app-palette";
import { ItemStatus } from "@/models/WorkoutStatus";

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
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        gap: 14,
      }}
    >
      {blocks.map((block) => (
        <View
          key={block.id}
          style={{
            alignItems: "center",
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
            }}
          >
            {block.title.replace(" Routine", "")}
          </Text>
        </View>
      ))}
    </View>
  );
}

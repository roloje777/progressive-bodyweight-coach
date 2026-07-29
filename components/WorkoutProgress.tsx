import React from "react";
import { View, Text } from "react-native";
import { appStyles } from "@/styles/appStyles";
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
              color: "#FFD700",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {getIcon(block.status)}
          </Text>

          <Text
            style={{
              color: "#FFF",
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
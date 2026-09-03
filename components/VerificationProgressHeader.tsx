// components/VerificationProgressHeader.tsx

import React from "react";
import { Text, View } from "react-native";

type VerificationProgressHeaderProps = {
  levelTitle: string;
  day: number;
  totalDays: number;
};

export default function VerificationProgressHeader({
  levelTitle,
  day,
  totalDays,
}: VerificationProgressHeaderProps) {
  const completedBeforeCurrent = Math.max(0, Math.min(day, totalDays));
  const progress =
    totalDays > 0 ? Math.round((completedBeforeCurrent / totalDays) * 100) : 0;

  return (
    <View
      style={{
        backgroundColor: "#142416",
        borderBottomWidth: 1,
        borderBottomColor: "#456A38",
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              color: "#C5E1A5",
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 1.4,
              marginBottom: 4,
            }}
          >
            ✓ VERIFICATION
          </Text>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: "800",
            }}
          >
            {levelTitle}
          </Text>
        </View>

        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            borderWidth: 2,
            borderColor: "#8BC34A",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1B2A16",
          }}
        >
          <Text
            style={{
              color: "#C5E1A5",
              fontSize: 23,
              fontWeight: "900",
            }}
          >
            ✓
          </Text>
        </View>
      </View>

      <Text
        style={{
          color: "#C7D3C2",
          fontSize: 13,
          lineHeight: 19,
          marginBottom: 14,
        }}
      >
        Confirm comfortable, good-form training before normal progression
        resumes. Match-or-Beat targets begin at 80% of your healthy
        pre-recovery baseline.
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: "#A5B69F",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          RECOVERY
        </Text>

        <Text
          style={{
            color: "#C5E1A5",
            fontSize: 12,
            fontWeight: "800",
          }}
        >
          VERIFY
        </Text>

        <Text
          style={{
            color: "#A5B69F",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          RESUME
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#6E8E62",
          }}
        />
        <View
          style={{
            flex: 1,
            height: 2,
            backgroundColor: "#6E8E62",
          }}
        />
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 3,
            borderColor: "#8BC34A",
            backgroundColor: "#1B2A16",
          }}
        />
        <View
          style={{
            flex: 1,
            height: 2,
            backgroundColor: "#3A4B35",
          }}
        />
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#3A4B35",
          }}
        />
      </View>

      <View
        style={{
          height: 7,
          borderRadius: 4,
          backgroundColor: "#263A22",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "#8BC34A",
          }}
        />
      </View>

      <Text
        style={{
          color: "#A5B69F",
          fontSize: 12,
          marginTop: 7,
          textAlign: "right",
        }}
      >
        Day {Math.min(day + 1, totalDays)} of {totalDays}
      </Text>
    </View>
  );
}

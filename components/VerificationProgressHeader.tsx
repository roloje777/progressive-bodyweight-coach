// components/VerificationProgressHeader.tsx

import React from "react";
import { Text, View } from "react-native";
import { useAppPalette } from "@/hooks/use-app-palette";

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
  const palette = useAppPalette();
  const completedBeforeCurrent = Math.max(0, Math.min(day, totalDays));
  const progress =
    totalDays > 0 ? Math.round((completedBeforeCurrent / totalDays) * 100) : 0;

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
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
              color: palette.accent,
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
              color: palette.text,
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
            borderColor: palette.accent,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.surfaceAlt,
          }}
        >
          <Text
            style={{
              color: palette.accent,
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
          color: palette.text,
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
            color: palette.textMuted,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          RECOVERY
        </Text>

        <Text
          style={{
            color: palette.accent,
            fontSize: 12,
            fontWeight: "800",
          }}
        >
          VERIFY
        </Text>

        <Text
          style={{
            color: palette.textMuted,
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
            backgroundColor: palette.disabled,
          }}
        />
        <View
          style={{
            flex: 1,
            height: 2,
            backgroundColor: palette.disabled,
          }}
        />
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 3,
            borderColor: palette.accent,
            backgroundColor: palette.surfaceAlt,
          }}
        />
        <View
          style={{
            flex: 1,
            height: 2,
            backgroundColor: palette.surfaceAlt,
          }}
        />
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: palette.surfaceAlt,
          }}
        />
      </View>

      <View
        style={{
          height: 7,
          borderRadius: 4,
          backgroundColor: palette.surfaceAlt,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: palette.accent,
          }}
        />
      </View>

      <Text
        style={{
          color: palette.textMuted,
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

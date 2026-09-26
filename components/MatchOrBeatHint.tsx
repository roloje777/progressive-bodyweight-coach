import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAppPalette } from "@/hooks/use-app-palette";

const MATCH_OR_BEAT_HINT_SEEN_KEY = "pbh.matchOrBeatHintSeen.v1";

/**
 * A one-time, inline explanation shown when the user first encounters a real
 * Match or Beat target. It deliberately avoids a modal/coach interruption.
 */
export const MatchOrBeatHint: React.FC = () => {
  const palette = useAppPalette();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const seen = await AsyncStorage.getItem(MATCH_OR_BEAT_HINT_SEEN_KEY);
        if (seen === "true") return;

        if (mounted) setVisible(true);
        await AsyncStorage.setItem(MATCH_OR_BEAT_HINT_SEEN_KEY, "true");
      } catch {
        // Storage failure should never interfere with the workout. In that
        // case, show the explanation for this mount only.
        if (mounted) setVisible(true);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: palette.primary,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: -4,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          color: palette.text,
          fontSize: 13,
          lineHeight: 18,
          textAlign: "center",
        }}
      >
        This target comes from your previous comparable performance. Aim to
        match or improve it with controlled form.
      </Text>
    </View>
  );
};

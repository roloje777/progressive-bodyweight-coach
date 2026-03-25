import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

export default function WorkoutFlow() {
  const router = useRouter();

  useEffect(() => {
    // Start with warmup
    router.replace("/screens/dynamicWarmUp");
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Preparing Workout...</Text>
    </View>
  );
}
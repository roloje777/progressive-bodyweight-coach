import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";


export default function WorkoutFlow() {
  const router = useRouter();
  const params = useLocalSearchParams();
const dayIndex = Number(params.dayIndex ?? 0);

  useEffect(() => {
    // Start with warmup
    router.replace({
  pathname: "/screens/dynamicWarmUp",
  params: { dayIndex },
});
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Preparing Workout...</Text>
    </View>
  );
}
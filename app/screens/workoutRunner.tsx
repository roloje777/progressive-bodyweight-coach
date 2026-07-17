import { useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";

export default function WorkoutRunner() {
  const params = useLocalSearchParams();
 const startWorkoutTimeParam = params.startWorkoutTime as string;
 console.log("workoutRunner - startWorkoutTimeParam " + startWorkoutTimeParam)
  const session = JSON.parse(params.session as string);
  const blockIndex = Number(params.blockIndex);

  const block = session.blocks[blockIndex];

  useEffect(() => {
    if (!block) {
      router.replace({
        pathname: "/screens/workoutSummary",
        params: {
          session: JSON.stringify(session),
          startWorkoutTimeParam,
        },
      });
      return;
    }
    console.log("block = " + block.type);
    switch (block.type) {
      case "warmup":
        router.replace({
          pathname: "/screens/dynamicWarmUp",
          params: {
            session: JSON.stringify(session),
            blockIndex: String(blockIndex),
            startWorkoutTimeParam,
          },
        });
        break;

      case "main":
        router.replace({
          pathname: "/screens/workout",
          params: {
            session: JSON.stringify(session),
            blockIndex: String(blockIndex),
            startWorkoutTimeParam,
          },
        });
        break;

      case "stretch":
        router.replace({
          pathname: "/screens/staticStretch",
          params: {
            session: JSON.stringify(session),
            blockIndex: String(blockIndex),
            startWorkoutTimeParam,
          },
        });
        break;
    }
  }, [block]);

  return null; // nothing rendered; redirect happens automatically
}

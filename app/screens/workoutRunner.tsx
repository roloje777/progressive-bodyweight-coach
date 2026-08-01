//app/screens/workoutRunner.tsx
import { useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { ItemStatus } from "@/models/WorkoutStatus";

export default function WorkoutRunner() {
  const params = useLocalSearchParams();
  const startWorkoutTimeParam = params.startWorkoutTime as string;
  console.log("workoutRunner - startWorkoutTimeParam " + startWorkoutTimeParam);

  const session = JSON.parse(params.session as string);
  const blockIndex = Number(params.blockIndex);

  // Create a mutable copy of the session
const updatedSession = {
  ...session,
  blocks: [...session.blocks],
};

// If we've just moved to a new block,
// complete the previous one.
if (blockIndex > 0) {
  const previous = updatedSession.blocks[blockIndex - 1];

  if (!previous.completedAt) {
    updatedSession.blocks[blockIndex - 1] = {
      ...previous,
      status: "completed",
      completedAt: Date.now(),
    };
  }
}

// Current block
const block = updatedSession.blocks[blockIndex];


  // Activate the block the first time we enter it
  if (block && !block.startedAt) {
    updatedSession.blocks[blockIndex] = {
      ...block,
      startedAt: Date.now(),
      status: ItemStatus.InProgress,
    };
  }

  useEffect(() => {
    if (!block) {
      router.replace({
        pathname: "/screens/workoutSummary",
        params: {
          session: JSON.stringify(updatedSession),
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
            session: JSON.stringify(updatedSession),
            blockIndex: String(blockIndex),
            startWorkoutTimeParam,
          },
        });
        break;

      case "main":
        router.replace({
          pathname: "/screens/workout",
          params: {
            session: JSON.stringify(updatedSession),
            blockIndex: String(blockIndex),
            startWorkoutTimeParam,
          },
        });
        break;

      case "stretch":
        router.replace({
          pathname: "/screens/staticStretch",
          params: {
            session: JSON.stringify(updatedSession),
            blockIndex: String(blockIndex),
            startWorkoutTimeParam,
          },
        });
        break;
    }
  }, [block]);

  return null; // nothing rendered; redirect happens automatically
}

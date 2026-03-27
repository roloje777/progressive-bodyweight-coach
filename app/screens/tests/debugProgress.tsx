import { View, Text, Pressable, StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { useProgress } from "@/hooks/useProgress";

export default function DebugProgress() {
     const router = useRouter();
  const { setTestProgress } = useProgress();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Progress</Text>

      <Pressable
        style={styles.button}
        onPress={() => {setTestProgress(0, 3, 3)
              router.replace("/");
        }            

        }
      >
        <Text style={styles.text}>Beginner - Week 4 Day 4</Text>
      </Pressable>
        <Pressable
        style={styles.button}
        onPress={() => {setTestProgress(0, 0, 0)
              router.replace("/");
        }            

        }
      >
        <Text style={styles.text}>Beginner - Week 1 Day 1</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => {setTestProgress(0, 2, 3)
              router.replace("/");
        }            

        } 
      >
        <Text style={styles.text}>Beginner - End</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => {setTestProgress(1, 0, 0)
              router.replace("/");
        }            

        }
      >
        <Text style={styles.text}>Growth Program Start</Text>
      </Pressable>

         <Pressable
        style={styles.button}
        onPress={() => {setTestProgress(1, 0, 1)
              router.replace("/");
        }            

        }
      >
        <Text style={styles.text}>Growth Program  W1 D2</Text>
      </Pressable>

         <Pressable
        style={styles.button}
        onPress={() => {setTestProgress(1, 0, 2)
              router.replace("/");
        }            

        }
      >
        <Text style={styles.text}>Growth Program W1 D3</Text>
      </Pressable>

          <Pressable
        style={styles.button}
        onPress={() => {setTestProgress(1, 0, 3)
              router.replace("/");
        }            

        }
      >
        <Text style={styles.text}>Growth Program W1 D4</Text>
      </Pressable>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // 🔥 THIS WAS MISSING
    padding: 20,
    backgroundColor: "#000", // optional but helps visibility
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    padding: 15,
    backgroundColor: "#333",
    borderRadius: 10,
    marginBottom: 10,
  },
  text: {
    color: "#fff",
  },
});
import { View, Text, ScrollView, Image, Linking, Pressable } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import rawGuides from "@/data/exerciseGuide.json";
import { ExerciseGuideMap } from "@/models/ExerciseGuide";
import { useAppStyles } from "@/styles/appStyles";
import { exerciseImages } from "@/utils/exerciseImages";

const Indicator = ({ level }: { level: number }) => {
  return (
    <View style={{ flexDirection: "row", marginBottom: 10 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: 20,
            height: 8,
            marginRight: 4,
            borderRadius: 4,
            backgroundColor: i <= level ? "#4CAF50" : "#ddd",
          }}
        />
      ))}
    </View>
  );
};

export default function ExerciseGuideScreen() {
  const styles = useAppStyles();
  const router = useRouter();
  const guides: ExerciseGuideMap = rawGuides;
  const { exerciseId, returnTo } = useLocalSearchParams<{
    exerciseId?: string;
    returnTo?: string;
  }>();

  const guide = guides[exerciseId as keyof typeof guides];
  if (!guide) {
    return (
      <View style={styles.container}>
        <Text>Exercise not found</Text>
      </View>
    );
  }
  const openVideo = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            if (returnTo === "week1Coach") {
              router.replace({
                pathname: "/",
                params: { openWeek1Coach: "exercises" },
              });
              return;
            }
            router.back();
          }}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            paddingHorizontal: 4,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            ‹ Back
          </Text>
        </Pressable>

        {/* Title */}
        <Text style={styles.title}>{guide.title}</Text>

        {/* Image */}
        <Image
          source={
            exerciseImages[guide.image] ??
            require("@/assets/images/exercises/placeholder.png")
          }
          style={styles.exerciseImage}
          resizeMode="contain"
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.text}>{guide.description}</Text>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.tagContainer}>
          {guide.category.map((cat, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{cat}</Text>
            </View>
          ))}
        </View>

        {/* Muscles */}
        <Text style={styles.sectionTitle}>Muscles Worked</Text>

        <Text style={styles.subSectionTitle}>Primary</Text>
        <View style={styles.tagContainer}>
          {guide.muscles.primary.map((muscle, i) => (
            <View key={i} style={[styles.tag, styles.primaryTag]}>
              <Text style={styles.tagText}>{muscle}</Text>
            </View>
          ))}
        </View>

        {guide.muscles.secondary.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>Secondary</Text>
            <View style={styles.tagContainer}>
              {guide.muscles.secondary.map((muscle, i) => (
                <View key={i} style={[styles.tag, styles.secondaryTag]}>
                  <Text style={styles.tagText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Difficulty */}
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <Indicator level={guide.difficulty} />

        {/* Effectiveness */}
        <Text style={styles.sectionTitle}>Hypertrophy Effectiveness</Text>
        <Indicator level={guide.effectiveness} />

        {/* Steps */}
        <Text style={styles.sectionTitle}>How to Perform</Text>
        {guide.steps.map((step, i) => (
          <Text key={i} style={styles.text}>
            {i + 1}. {step}
          </Text>
        ))}

        {/* Video */}
        {guide.videoUrl && guide.videoUrl.trim() !== "" ? (
          <>
            <Text style={styles.sectionTitle}>Watch Video</Text>

            <Pressable
              style={styles.videoLinkButton}
              onPress={() => openVideo(guide.videoUrl)}
            >
              <Text style={styles.videoLinkText}>Open Video</Text>
            </Pressable>
          </>
        ) : null}

        {/* Safety */}
        <Text style={styles.sectionTitle}>Safety</Text>
        {guide.safety.map((item, i) => (
          <Text key={i} style={styles.warningText}>
            • {item}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

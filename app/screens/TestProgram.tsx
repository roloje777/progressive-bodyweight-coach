import React, { useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { beginnerProgram } from "../../data/beginnerProgram";

export default function TestProgram() {
  useEffect(() => {
    console.log("Beginner Program:", beginnerProgram);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Beginner Program Overview</Text>

      <FlatList
        data={beginnerProgram.days}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.dayContainer}>
            <Text style={styles.dayTitle}>{item.title}</Text>
            {item.exercises.length > 0 ? (
              item.exercises.map((ex) => (
                <Text key={ex.id} style={styles.exerciseText}>
                  - {ex.name} ({ex.type}, {ex.sets} sets)
                </Text>
              ))
            ) : (
              <Text style={styles.exerciseText}>Rest / No exercises</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  dayContainer: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 8 },
  dayTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  exerciseText: { fontSize: 16, marginLeft: 8 },
});
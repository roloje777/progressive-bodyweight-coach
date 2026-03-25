import { StyleSheet } from "react-native";

export const appStyles = StyleSheet.create({
container: {
  flex: 1,
  justifyContent: "flex-start",
  alignItems: "center",
  padding: 20,
  backgroundColor: "#111",
},
  screen: {
  flex: 1,
  backgroundColor: "#111",
},

  timer: {
    fontSize: 50,
    color: "white",
    marginVertical: 10,
  },

  button: {
    margin: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
  },

 stopButton: {
  backgroundColor: "#FF3B30",
  paddingVertical: 18,
  paddingHorizontal: 40,
},

  disabledButton: {
    backgroundColor: "#555",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },

  setText: {
    color: "#FFD700",
    fontSize: 18,
    marginTop: 5,
  },
  phaseText: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FFF",
    padding: 8,
    marginLeft: 10,
    borderRadius: 8,
    width: 80,
    color: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  state: { color: "white", fontSize: 16, marginTop: 10 },
  currentSet: {
    fontSize: 20,
    color: "#00FF00",
    marginVertical: 5,
  },

  target: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 10,
  },
  visualContainer: {
  alignItems: "center",
  justifyContent: "center",
  marginVertical: 30,
},

holdLabel: {
  fontSize: 26,
  color: "#FFD700",
  fontWeight: "bold",
  marginBottom: 10,
},

bigTimer: {
  fontSize: 90,
  fontWeight: "bold",
  color: "white",
},

secondsLabel: {
  fontSize: 16,
  color: "#aaa",
  marginBottom: 20,
},

progressBarBackground: {
  width: "80%",
  height: 14,
  backgroundColor: "#333",
  borderRadius: 10,
  overflow: "hidden",
},

progressBarFill: {
  height: "100%",
  backgroundColor: "#FF6B00",
},
summaryCard: {
  backgroundColor: "#222",
  padding: 15,
  borderRadius: 10,
  marginBottom: 15,
  width: "100%",
},

exerciseTitle: {
  color: "white",
  fontSize: 18,
  marginBottom: 5,
  fontWeight: "bold",
},

summaryDate: {
  color: "#aaa",
  fontSize: 16,
  marginBottom: 20,
  textAlign: "center",
},

summaryMessage: {
  fontSize: 18,
  color: "#FFD700",
  textAlign: "center",
  marginVertical: 20,
},

summaryContainer: {
  width: "100%",
  marginTop: 10,
},
// Workout Details / Summary styles

header: {
  color: "white",
  fontWeight: "600",
  marginBottom: 5,
},
headerContainer: {
  padding: 20,
  backgroundColor: "#111",
  alignItems: "center",
},

subHeader: {
  color: "#aaa",
  marginBottom: 10,
},

totalWorkout: {
  color: "#4CAF50",
  marginBottom: 20,
  fontWeight: "bold",
  fontSize: 16,
},

exerciseTotal: {
  color: "#4CAF50",
  marginBottom: 5,
},

errorText: {
  color: "white",
  fontSize: 16,
  textAlign: "center",
},
historyCard: {
  backgroundColor: "#222",
  padding: 15,
  marginBottom: 15,
  borderRadius: 10,
  width: "100%",
},

historyDate: {
  color: "white",
  fontWeight: "bold",
  marginBottom: 5,
},

historyText: {
  color: "#ccc",
},

workoutHeader: {
  width: "100%",
  marginBottom: 20,
},

rowBetween: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 6,
},

labelLeft: {
  color: "white",
  fontSize: 16,
  fontWeight: "600",
},

labelRight: {
  color: "#FFD700",
  fontSize: 16,
},

titleLeft: {
  fontSize: 26,
  fontWeight: "bold",
  color: "white",
},

titleRight: {
  fontSize: 16,
  color: "#FFD700",
},

startButtonContainer: {
  marginTop: 20,
  alignItems: "center",
  width: "100%",
},
dateRow: {
  width: "100%",
  alignItems: "flex-end",
  marginBottom: 10,
},

dateText: {
  color: "#FFD700",
  fontSize: 14,
},

programInfo: {
  width: "100%",
  marginBottom: 15,
},

dayTitle: {
  color: "white",
  fontSize: 18,
  fontWeight: "600",
},

programLevel: {
  color: "#aaa",
  fontSize: 16,
  marginTop: 2,
},

estimateText: {
  color: "#FFD700",
  fontSize: 16,
  textAlign: "center",
  marginVertical: 20,
},
exerciseList: {
  width: "100%",
  marginTop: 10,
},

exerciseCard: {
  backgroundColor: "#222",
  padding: 15,
  borderRadius: 12,
  marginBottom: 12,
  width: "100%",
},

exerciseName: {
  color: "white",
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 6,
},

exerciseMeta: {
  flexDirection: "row",
  justifyContent: "space-between",
},

exerciseType: {
  color: "#FFD700",
  textTransform: "capitalize",
},

exerciseSets: {
  color: "#4CAF50",
  fontWeight: "bold",
},
exerciseDescription: {
  fontSize: 14,
  color: "#888", // softer, secondary text
  marginTop: 2,
  marginBottom: 8,
  textAlign: "center",
},
});

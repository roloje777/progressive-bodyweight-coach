import { StyleSheet } from "react-native";

export const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
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
});

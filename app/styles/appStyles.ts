import { StyleSheet } from "react-native";

export const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    backgroundColor: "#FF0000",
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
});

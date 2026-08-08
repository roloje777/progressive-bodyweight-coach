import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type WorkoutMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSkipSet?: () => void;
  onSkipExercise?: () => void;
  onSkipSection?: () => void;
  onAbortWorkout?: () => void;
};

export default function WorkoutMenu({
  visible,
  onClose,
  onSkipSet,
  onSkipExercise,
  onSkipSection,
  onAbortWorkout,
}: WorkoutMenuProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.menu} onPress={() => {}}>
          <Text style={styles.title}>Workout Options</Text>

          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onSkipSet?.();
              onClose();
            }}
          >
            <Text style={styles.itemText}>Skip Set</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onSkipExercise?.();
              onClose();
            }}
          >
            <Text style={styles.itemText}>Skip Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              onSkipSection?.();
              onClose();
            }}
          >
            <Text style={styles.itemText}>Skip Section</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.item, styles.abortItem]}
            onPress={() => {
              onAbortWorkout?.();
            }}
          >
            <Text style={styles.abortText}>Abort Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  menu: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },

  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },

  itemText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },

  abortItem: {
    marginTop: 8,
  },

  abortText: {
    color: "#FF6B6B",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  cancelButton: {
    marginTop: 24,
    paddingVertical: 14,
  },

  cancelText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

export default function Button({ onPress, active }) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true
    }).start();
  }

  function pressOut() {
    Animated.spring(scale, {
      toValue: active ? 1 : 1,
      friction: 4,
      useNativeDriver: true
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.button,
          active && styles.active
        ]}
      >
        <Text style={styles.text}>
          {active ? "ACTIVATE" : "PANIC"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#c62828",
    alignItems: "center",
    justifyContent: "center",
    marginTop:150
  },
  active: {
    backgroundColor: "#2e7d32"
  },
  text: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold"
  }
});
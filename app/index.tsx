import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../component/Button";
import { PanicProvider, startPanic, stopPanic } from "../lib/panic";
import * as SecureStore from "expo-secure-store"
import { useRouter } from "expo-router"

export default function Index() {
  const [active, setActive] = useState(false);
  const router = useRouter();

  function onBtnPress() {
    if (!active) {
      startPanic();
    } else {
      stopPanic();
    }
    setActive(!active);
  }

  function logOut(){
    SecureStore.deleteItemAsync("jwt");
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <PanicProvider />
      <Text style={styles.text}>Hit the button below in a panic situation</Text>
      <Button onPress={onBtnPress} active={active} />
      <Pressable style={styles.button} onPress={logOut}>
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
  },
    button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 30,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

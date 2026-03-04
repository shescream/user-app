import { View, TextInput, StyleSheet, Pressable, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const URL = "https://api.246897.xyz"

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function checkConnectivity() {
    return new Promise((resolve, reject) => {
      fetch(`${URL}/ping`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message == "pong") {
            console.log("Connected to server");
            resolve(true);
          } else {
            console.log("Not connected to server");
            resolve(false);
          }
        })
        .catch((error) => console.error(error));
    });
  }

  const handleLogin = async () => {
    const token = await SecureStore.getItemAsync("jwt");
    if (!(await checkConnectivity())) {
      alert("internet issue");
      return;
    }
    if (token) {
      var passed = false;
      // validate token
      fetch(`${URL}/whoami`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(async (data) => {
          if (data.message != "invalid token") {
            router.replace("/");
            passed = true;
          }
        });
        if(passed)return;
    }

    try {
      const res = await fetch(`${URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username:username.trim(), password:password.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      SecureStore.setItemAsync("jwt", data.token);
      router.replace("/");
    } catch (err) {
      console.log("network error", err);
    }
  };

  const signup = async () => {
    router.replace("/signup");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.text}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.text}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
      <Pressable onPress={signup} style={styles.button}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 30
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
  },
  text: {
    color: "#25292e",
    fontWeight: "bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    width: "60%",
  },
});

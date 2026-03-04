import { View, TextInput, StyleSheet, Pressable, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const URL = "https://api.246897.xyz"

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (password1.trim() != password2.trim()) {
      alert("password1 and password2 mismatch");
      return;
    }
    if (password1.trim().length < 6) {
      alert("Password must be minimum 6 characters long");
      return;
    }
    if (!username || !password1 || !password2) {
      alert("fill all the fields");
      return;
    }
    fetch(`${URL}/signup`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username:username.trim(), password:password1.trim()})
    })
    .then(res => res.json())
    .then(data =>{
        if(data.token){
            SecureStore.setItem("jwt", data.token);
            alert("registed successfully");
            router.replace("/")
        }
        else{
            alert(data.message);
        }
    })
  };

  const login = async () => {
    router.replace("/login");
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
        placeholder="Password1"
        secureTextEntry
        value={password1}
        onChangeText={setPassword1}
      />

      <TextInput
        style={styles.text}
        placeholder="Password2"
        secureTextEntry
        value={password2}
        onChangeText={setPassword2}
      />

      <Pressable onPress={handleSignup} style={styles.button}>
        <Text style={styles.buttonText}>Sign up</Text>
      </Pressable>
      <Pressable onPress={login} style={styles.button}>
        <Text style={styles.buttonText}>Log in</Text>
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
    marginTop: 30,
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

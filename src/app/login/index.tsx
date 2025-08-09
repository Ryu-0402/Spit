import { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("入力不足", "メールとパスワードを入力してください。");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/protected/freeMatchScreen");
    } catch (err: any) {
      Alert.alert("ログイン失敗", err.message ?? "ログインできませんでした。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="bg-white" 
      style={{ padding: 20, gap: 8 }}>
      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        style={{ borderWidth: 1, padding: 8, borderRadius: 6 }}
      />
      <Text>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        style={{ borderWidth: 1, padding: 8, borderRadius: 6 }}
      />
      <Button title={loading ? "ログイン中..." : "ログイン"} onPress={handleLogin} disabled={loading} />
      <Button title="新規登録へ" onPress={() => router.push("/signup")} />
    </View>
  );
}
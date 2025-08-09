import { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("入力不足", "メールとパスワードを入力してください。");
      return;
    }
    try {
      setLoading(true);

      // Expo Go では useProxy:true を使う（https://auth.expo.io/... 経由）
      const redirectTo = makeRedirectUri({
        path: "auth-callback",
      });
      // 開発時にこの値を Supabase の Additional Redirect URLs に登録する
      console.log("redirectTo =", redirectTo);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      if (data.session) {
        router.replace("/protected/freeMatchScreen"); // 確認OFF時（基本は来ない）
      } else {
        Alert.alert("確認メールを送信しました", "メールのリンクを開いて認証を完了してください。");
        router.replace("/login");
      }
    } catch (err: any) {
      Alert.alert("登録失敗", err.message ?? "登録できませんでした。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, gap: 8 }}>
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
        textContentType="newPassword"
        style={{ borderWidth: 1, padding: 8, borderRadius: 6 }}
      />
      <Button title={loading ? "登録中..." : "登録"} onPress={handleSignup} disabled={loading} />
      <Button title="ログインに戻る" onPress={() => router.push("/login")} />
    </View>
  );
}
import { useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // 初回URL
    Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    // 起動中に受けたURL
    const sub = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      sub.remove();
    };
  }, []);

  const handleUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) {
      Alert.alert("エラー", errorCode);
      return router.replace("/login");
    }
    const { access_token, refresh_token } = params as Record<string, string>;

    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        Alert.alert("ログイン失敗", error.message);
        return router.replace("/login");
      }
      return router.replace("/protected/freeMatchScreen");
    }
    // トークンなし→通常ログインへ
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
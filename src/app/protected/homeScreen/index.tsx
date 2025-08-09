import React, { useCallback, useEffect, useState } from "react";
import { View, Button, Image, Text, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import Footer from "@/components/footer";

export default function AvatarUploadBase64() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");

  const appendLog = (s: string) => setLog((prev) => prev + s + "\n");

  const loadAvatar = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;

    const { data: row } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", uid)
      .single();

    if (!row?.avatar_path) return;

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(row.avatar_path);
    if (pub?.publicUrl) setUrl(`${pub.publicUrl}?t=${Date.now()}`);
  }, []);

  useEffect(() => { loadAvatar(); }, [loadAvatar]);
  useFocusEffect(useCallback(() => { loadAvatar(); }, [loadAvatar]));

  const pickAndUpload = async () => {
    try {
      setBusy(true);
      setLog("");

      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) { Alert.alert("写真アクセスを許可してください"); return; }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 1, base64: false,
      });
      if (res.canceled) return;

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) { Alert.alert("未ログインです"); return; }

      const out = await ImageManipulator.manipulateAsync(
        res.assets[0].uri, [], { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      const b64 = await FileSystem.readAsStringAsync(out.uri, { encoding: FileSystem.EncodingType.Base64 });
      const ab = decode(b64);
      if (!ab || ab.byteLength === 0) { Alert.alert("失敗", "画像が0バイトです"); return; }

      const storagePath = `${uid}/original.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(storagePath, ab, { contentType: "image/jpeg", upsert: true });
      if (upErr) { Alert.alert("アップロード失敗", upErr.message); return; }

      const { error: dbErr } = await supabase
        .from("profiles")
        .upsert({ id: uid, avatar_path: storagePath });
      if (dbErr) { Alert.alert("保存失敗", dbErr.message); return; }

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(storagePath);
      if (!pub?.publicUrl) { Alert.alert("URL取得失敗"); return; }

      setUrl(`${pub.publicUrl}?t=${Date.now()}`);
    } catch (e: any) {
      Alert.alert("エラー", e?.message ?? "処理に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 16, backgroundColor: "#000" }}>
      <Image
        source={{ uri: url || "https://via.placeholder.com/150" }}
        style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: "#222" }}
      />
      <Button title={busy ? "アップロード中..." : "写真を選んでアップロード"} onPress={pickAndUpload} disabled={busy} />
      <Text style={{ color: "#8a8a8a", fontSize: 12, marginTop: 12 }} selectable>{log}</Text>
      <Footer />
    </View>
  );
}
import React, { useCallback, useEffect, useState } from "react";
import { View, Button, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";
import Footer from "@/components/footer";

export default function AvatarUpload() {
  const [url, setUrl] = useState<string | null>(null);

  const loadAvatar = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;

    const { data } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", uid)
      .single();

    if (!data?.avatar_path) return;

    const { data: pub } = supabase.storage
      .from("avatars")
      .getPublicUrl(data.avatar_path);

    if (pub?.publicUrl) setUrl(`${pub.publicUrl}?t=${Date.now()}`); // ← キャッシュ破り
  }, []);

  useEffect(() => { loadAvatar(); }, [loadAvatar]);

  const pickAndUpload = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("許可が必要です"); return; }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });
    if (res.canceled) return;

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;

    const out = await ImageManipulator.manipulateAsync(
      res.assets[0].uri,
      [],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    const b64 = await FileSystem.readAsStringAsync(out.uri, {
      encoding: FileSystem.EncodingType.Base64
    });
    const ab = decode(b64);
    if (ab.byteLength === 0) { Alert.alert("失敗", "画像が0バイトです"); return; }

    const storagePath = `${uid}/original.jpg`;

    await supabase.storage
      .from("avatars")
      .upload(storagePath, ab, { contentType: "image/jpeg", upsert: true });

    await supabase
      .from("profiles")
      .upsert({ id: uid, avatar_path: storagePath });

    loadAvatar(); // ← 即座に反映
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Image
        source={{ uri: url || "https://via.placeholder.com/150" }}
        style={{ width: 150, height: 150, borderRadius: 75 }}
      />
      <Button title="写真を選んでアップロード" onPress={pickAndUpload} />

      <Footer />
    </View>
  );
}
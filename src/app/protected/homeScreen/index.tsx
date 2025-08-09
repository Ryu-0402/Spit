import React, { useState } from "react";
import { View, Button, Image, Text, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase"; // ← あなたのクライアントに合わせて
import Footer from "@/components/footer"; // フッターコンポーネントのインポート

export default function AvatarUploadBase64() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");

  const appendLog = (s: string) => setLog((prev) => prev + s + "\n");

  const pickAndUpload = async () => {
    try {
      setBusy(true);
      setLog("");

      // 1) 権限 + 画像選択
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert("写真アクセスを許可してください");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: false,
      });
      if (res.canceled) return;

      // 2) ログインユーザー
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        Alert.alert("未ログインです");
        return;
      }

      // 3) HEIC / content:// 対策: JPEGに再エンコードして file:// を得る
      appendLog("Re-encode to JPEG...");
      const out = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 4) Base64 → ArrayBuffer（0バイト対策）
      appendLog("Read as Base64...");
      const b64 = await FileSystem.readAsStringAsync(out.uri, { encoding: FileSystem.EncodingType.Base64 });
      const ab = decode(b64);
      appendLog(`ArrayBuffer length: ${ab.byteLength}`);
      if (!ab || ab.byteLength === 0) {
        Alert.alert("失敗", "画像が0バイトです");
        return;
      }

      // 5) アップロード（upsert: true / MIME一致）
      const key = `${uid}/original.jpg`; // 先頭に 'avatars/' は付けない
      appendLog(`Uploading to: avatars/${key}`);
      const { error } = await supabase.storage
        .from("avatars") // ← バケット名（'files' なら置き換え）
        .upload(key, ab, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        appendLog(`Upload error: ${error.message}`);
        Alert.alert("アップロード失敗", error.message);
        return;
      }

      // 6) 公開URL取得（バケットは select 公開にしておく）
      const { data } = supabase.storage.from("avatars").getPublicUrl(key);
      if (!data?.publicUrl) {
        appendLog("Failed to get publicUrl");
        Alert.alert("URL取得失敗");
        return;
      }

      const finalUrl = `${data.publicUrl}?t=${Date.now()}`; // キャッシュ破り
      appendLog(`Done. URL: ${finalUrl}`);
      setUrl(finalUrl);
    } catch (e: any) {
      Alert.alert("エラー", e?.message ?? "処理に失敗しました");
      setLog((p) => p + (e?.message ?? String(e)) + "\n");
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

      <Footer/>
    </View>
  );
}
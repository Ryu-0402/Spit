import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

type Ctx = {
  avatarUrl: string | null;                    // 画面で使うURL
  setAvatarPath: (p: string | null) => Promise<void>; // アップロード直後に呼ぶ（パスを保存）
  refreshFromServer: () => Promise<void>;      // サーバー(profiles)→URL反映
};
const ProfileCtx = createContext<Ctx>({
  avatarUrl: null,
  setAvatarPath: async () => {},
  refreshFromServer: async () => {},
});
export const useProfile = () => useContext(ProfileCtx);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // 起動直後・画面復帰で一瞬でも消えないように、ローカルの「パス」からURLを再生成
  const rehydrateFromCache = useCallback(async () => {
    const path = await AsyncStorage.getItem("@avatar_path");
    if (!path) return;
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(pub.publicUrl ?? null);
  }, []);

  // サーバーの profiles.avatar_path からURLを生成して反映
  const refreshFromServer = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) { setAvatarUrl(null); return; }

    const { data } = await supabase.from("profiles").select("avatar_path").eq("id", uid).single();
    const path = `data?.avatar_path ?? ${uid}/original.jpg`;

    await AsyncStorage.setItem("@avatar_path", path); // 永続はパス
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(pub.publicUrl ?? null);
  }, []);

  // 認証変化で追従
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshFromServer().catch(() => {});
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshFromServer]);

  // 起動時：まずローカル→並行でサーバー
  useEffect(() => {
    (async () => {
      await rehydrateFromCache();
      await refreshFromServer();
    })();
  }, [rehydrateFromCache, refreshFromServer]);

  // アップロード直後に“パス”をContextへ渡す（URLはここで毎回生成する）
  const setAvatarPath = useCallback(async (p: string | null) => {
    if (!p) {
      await AsyncStorage.removeItem("@avatar_path");
      setAvatarUrl(null);
      return;
    }
    await AsyncStorage.setItem("@avatar_path", p);
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(p);
    setAvatarUrl(pub.publicUrl ?? null);
  }, []);

  const value = useMemo(() => ({ avatarUrl, setAvatarPath, refreshFromServer }), [avatarUrl, setAvatarPath, refreshFromServer]);
  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}
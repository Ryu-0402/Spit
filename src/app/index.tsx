import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const router = useRouter();
  const navigating = useRef(false); // 二重遷移防止

  useEffect(() => {
    const go = (hasSession: boolean) => {
      if (navigating.current) return;
      navigating.current = true;
      router.replace(hasSession ? "/protected/freeMatchScreen" : "/login");
      // 少し待ってから解除（連続イベント対策）
      setTimeout(() => (navigating.current = false), 300);
    };

    // 1) 初期セッション判定
    (async () => {
      const { data } = await supabase.auth.getSession();
      go(!!data.session);
    })();

    // 2) 以降の変化を購読
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      go(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return null; // 判定だけ
}
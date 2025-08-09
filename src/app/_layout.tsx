import "../global.css";
import { Slot } from "expo-router";
import { ProfileProvider } from "@/components/ProfileProvider";

export default function RootLayout() {
  return (
    <ProfileProvider>
      <Slot screenOptions={{ headerShown: false }} />
    </ProfileProvider>
  );
}
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

const Footer = () => {
  return (
    <View className="absolute flex-row justify-around items-center bg-green-500 bottom-0 w-full">
      <TouchableOpacity onPress={() => router.push("/protected/freeMatchScreen")}>
        <Text>フリーマッチ</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/protected/roomMatchScreen")}>
        <Text>ルームマッチ</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/protected/homeScreen")}>
        <Text>ホーム</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;

import { Text,TouchableOpacity,View } from "react-native";
import { router } from "expo-router";
import Footer from "@/components/footer";

const FreeMatchScreen = () => {
  return(
  <View className="flex-1">

{/* body */}
    <View className="w-full felx items-center justify-center h-full">
      <TouchableOpacity>
        <Text>freeButtle</Text>
      </TouchableOpacity>
    </View>
    

    <Footer/>      
  </View>
  )
}

export default FreeMatchScreen;
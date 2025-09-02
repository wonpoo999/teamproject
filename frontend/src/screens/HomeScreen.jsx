import { View, Text, Pressable, Image, ImageBackground } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation()

  const Box = ({ label, src, to }) => (
    <Pressable onPress={() => nav.navigate(to)} style={{ alignItems: 'center', gap: 8 }}>
      <Image source={src} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
      <Text style={{ fontSize: 16 }}>{label}</Text>
    </Pressable>
  )

  return (
    <ImageBackground source={require('../../assets/background/home.png')} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ flex: 1, paddingTop: insets.top + 24, paddingHorizontal: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <View style={{ flexDirection: 'row', gap: 28 }}>
            <Box src={require('../../assets/icons/profile.png')} to="Home" />
            <Box src={require('../../assets/icons/camera.png')} to="Camera" />
            <Box src={require('../../assets/icons/setting.png')} to="Settings" />
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

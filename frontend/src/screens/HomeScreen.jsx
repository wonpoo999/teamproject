import { View, Pressable, Image, ImageBackground } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation()

  const IconBtn = ({ src, to }) => (
    <Pressable onPress={() => nav.navigate(to)} style={{ alignItems: 'center' }}>
      <Image source={src} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
    </Pressable>
  )

  return (
    <ImageBackground source={require('../../assets/background/home.png')} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ flex: 1 }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 120, alignItems: 'center' }}>
          <Image
            source={require('../../assets/characters/hero.png')}
            style={{ width: 240, height: 248, resizeMode: 'contain' }}
          />
        </View>

        <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconBtn src={require('../../assets/icons/profile.png')} to="Home" />
            <IconBtn src={require('../../assets/icons/camera.png')} to="Camera" />
            <IconBtn src={require('../../assets/icons/setting.png')} to="Settings" />
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

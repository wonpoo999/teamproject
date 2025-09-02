import { View, Text, Pressable, Image, ImageBackground } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

export default function HomeScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const nav = useNavigation()

  const Box = ({ label, src, to }) => (
    <Pressable onPress={() => nav.navigate(to)} style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={src} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
      </View>
      <Text style={{ fontSize: 16 }}>{label}</Text>
    </Pressable>
  )

  return (
    <ImageBackground source={require('../../assets/background/home.png')} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ flex: 1, paddingTop: insets.top + 24, paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 24 }}>{user ? `Hello, ${user.id}` : 'Home'}</Text>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <View style={{ flexDirection: 'row', gap: 28 }}>
            <Box label="프로필" src={require('../../assets/icons/profile.png')} to="Home" />
            <Box label="카메라" src={require('../../assets/icons/camera.png')} to="Camera" />
            <Box label="설정" src={require('../../assets/icons/setting.png')} to="Settings" />
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

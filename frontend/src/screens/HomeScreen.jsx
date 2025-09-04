import { View, Pressable, Image, ImageBackground, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import AvatarByBMI from '../components/AvatarByBMI'

const ICON_SIZE = 96
const LABEL_SIZE = 70
const OVERLAP = 50

export default function HomeScreen({ route }) {
  const insets = useSafeAreaInsets()
  const nav = useNavigation()
  const category = route?.params?.category ?? 'normal'

  const IconLabeled = ({ iconSrc, labelSrc, to }) => (
    <Pressable onPress={() => nav.navigate(to)} style={{ alignItems: 'center' }}>
      <Image source={iconSrc} style={{ width: ICON_SIZE, height: ICON_SIZE, resizeMode: 'contain' }} />
      <Image source={labelSrc} style={{ width: ICON_SIZE + 24, height: LABEL_SIZE, resizeMode: 'contain', marginTop: -OVERLAP }} />
    </Pressable>
  )

  return (
    <ImageBackground source={require('../../assets/background/home.png')} style={{ flex: 1 }} resizeMode="cover">
          <View style={styles.topContainer}>
            <Pressable style={styles.box} onPress={() => nav.navigate('DietLog')}>
              <Text style={styles.boxText}>식단 기록</Text>
            </Pressable>
            <Pressable style={styles.box} onPress={() => nav.navigate('Data')}>
              <Text style={styles.boxText}>체중 비교</Text>
            </Pressable>
          </View>
      <View style={{ flex: 1 }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 150, alignItems: 'center' }}>
          <AvatarByBMI category={category} size={260} />
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
            <IconLabeled iconSrc={require('../../assets/icons/profile.png')} labelSrc={require('../../assets/icons/profile_.png')} to="Home" />
            <IconLabeled iconSrc={require('../../assets/icons/camera.png')} labelSrc={require('../../assets/icons/camera_.png')} to="Camera" />
            <IconLabeled iconSrc={require('../../assets/icons/setting.png')} labelSrc={require('../../assets/icons/setting_.png')} to="Settings" />
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  box: {
    backgroundColor: 'tomato',
    padding: 10,
    borderRadius: 8,
  },
  boxText: {
    color: '#fff',
    fontWeight: 'bold',
  },
})

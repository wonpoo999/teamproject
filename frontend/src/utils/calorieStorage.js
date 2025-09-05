import { useEffect, useState } from 'react'
import { View, ImageBackground, Text, Pressable, Image, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import AvatarByBMI from '../components/AvatarByBMI'
import { initCalorieData } from '../utils/calorieStorage'

const ICON_SIZE = 96
const LABEL_SIZE = 70
const OVERLAP = 50

function CalorieGauge({ current, target }) {
  const ratio = target > 0 ? Math.min(current / target, 1) : 0
  const overRatio = target > 0 && current > target ? (current - target) / target : 0
  return (
    <View style={styles.gaugeContainer}>
      <View style={[styles.gaugeFill, { width: `${ratio * 100}%`, backgroundColor: '#22c55e' }]} />
      {overRatio > 0 && (
        <View style={[styles.gaugeFill, { left: '100%', width: `${overRatio * 100}%`, backgroundColor: '#ef4444' }]} />
      )}
      <View style={styles.gaugeTextWrap}>
        <Text style={styles.gaugeText}>{current}/{target}</Text>
      </View>
    </View>
  )
}

export default function HomeScreen({ route }) {
  const insets = useSafeAreaInsets()
  const nav = useNavigation()
  const category = route?.params?.category ?? 'normal'
  const [target, setTarget] = useState(1200)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    ;(async () => {
      const { target, current } = await initCalorieData()
      setTarget(target)
      setCurrent(current)
    })()
  }, [])

  const IconLabeled = ({ iconSrc, labelSrc, to, onPress }) => (
    <Pressable onPress={onPress ?? (() => nav.navigate(to))} style={{ alignItems: 'center' }}>
      <Image source={iconSrc} style={{ width: ICON_SIZE, height: ICON_SIZE, resizeMode: 'contain' }} />
      <Image source={labelSrc} style={{ width: ICON_SIZE + 24, height: LABEL_SIZE, resizeMode: 'contain', marginTop: -OVERLAP }} />
    </Pressable>
  )

  return (
    <ImageBackground source={require('../../assets/background/home.png')} style={{ flex: 1 }} resizeMode="cover">
      <View style={[styles.topContainer, { marginTop: insets.top + 20 }]}>
        <Pressable style={styles.box} onPress={() => nav.navigate('DietLog')}>
          <Text style={styles.boxText}>🥗 식단 기록</Text>
        </Pressable>
        <Pressable style={styles.box} onPress={() => nav.navigate('Data')}>
          <Text style={styles.boxText}>👀 한눈에</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 150 + 260 + 20, alignItems: 'center' }} pointerEvents="none">
          <CalorieGauge current={current} target={target} />
        </View>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 150, alignItems: 'center' }} pointerEvents="none">
          <AvatarByBMI category={category} size={260} />
        </View>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
            <IconLabeled
              iconSrc={require('../../assets/icons/profile.png')}
              labelSrc={require('../../assets/icons/profile_.png')}
              to="Home"
              onPress={() => nav.navigate('Profile')}
            />
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
    paddingHorizontal: 11,
    gap: 12
  },
  box: {
    flex: 1,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 30,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  boxText: {
    fontSize: 22,
    height: 220,
    fontWeight: 'bold',
    color: '#333'
  },
  gaugeContainer: {
    width: '80%',
    height: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 8,
    overflow: 'hidden'
  },
  gaugeFill: {
    position: 'absolute',
    top: 0,
    bottom: 0
  },
  gaugeTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gaugeText: {
    color: 'gray',
    fontWeight: 'bold'
  }
})

import { useEffect, useState, useRef } from 'react'
import { View, ImageBackground, Text, Pressable, Image, StyleSheet, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import AvatarByBMI from '../components/AvatarByBMI'
import { initCalorieData } from '../utils/calorieStorage'
import { useFonts } from 'expo-font'

const ICON_SIZE = 96
const LABEL_SIZE = 70
const OVERLAP = 50
const FONT = 'DungGeunMo'

function CalorieGauge({ current, target }) {
  const r = target > 0 ? current / target : 0
  const greenTo = Math.min(Math.max(r, 0), 1)
  const redTo = r > 1 ? Math.min(r - 1, 1) : 0

  const animatedGreen = useRef(new Animated.Value(0)).current
  const animatedRed = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (redTo > 0) {
      animatedGreen.stopAnimation()
      animatedGreen.setValue(1)
      Animated.timing(animatedRed, { toValue: redTo, duration: 600, useNativeDriver: false }).start()
    } else {
      animatedRed.stopAnimation()
      animatedRed.setValue(0)
      Animated.timing(animatedGreen, { toValue: greenTo, duration: 600, useNativeDriver: false }).start()
    }
  }, [greenTo, redTo])

  const widthGreen = animatedGreen.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
  const widthRed = animatedRed.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <View style={styles.gaugeContainer}>
      <Animated.View style={[styles.gaugeFill, { width: widthGreen, backgroundColor: '#22c55e' }]} />
      <Animated.View style={[styles.gaugeFill, { right: 0, width: widthRed, backgroundColor: '#ef4444' }]} />
      <View style={styles.gaugeTextWrap}>
        <Text style={styles.gaugeText}>{current}/{target} kcal</Text>
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
  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') })

  const loadData = async () => {
    const { target, current } = await initCalorieData()
    setTarget(target)
    setCurrent(current)
  }

  useEffect(() => {
    loadData()
  }, [])

  useFocusEffect(() => {
    loadData()
  })

  if (!fontsLoaded) return null

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
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 150 + 260, alignItems: 'center' }} pointerEvents="none">
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
    color: '#333',
    fontFamily: FONT,
    includeFontPadding: false
  },
  gaugeContainer: {
    width: '65%',
    height: 20,
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
    fontSize: 12,
    fontFamily: FONT,
    includeFontPadding: false
  }
})

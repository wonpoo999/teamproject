import { useEffect, useState, useRef, useCallback } from 'react'
import { View, ImageBackground, Text, Pressable, Image, StyleSheet, Animated, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import AvatarByBMI from '../components/AvatarByBMI'
import { initCalorieData, setTargetCalories } from '../utils/calorieStorage'
import { useFonts } from 'expo-font'
import { useAuth } from '../context/AuthContext'
import { apiGet } from '../config/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { calcBMI, classifyBMI } from '../utils/bmi'

const ICON_SIZE = 72
const FONT = 'DungGeunMo'
const BOX_HEIGHT = Platform.select({ ios: 220, android: 170 })
const BOX_FONT = Platform.select({ ios: 22, android: 18 })
const BOX_PAD = Platform.select({ ios: 20, android: 14 })

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
      <Animated.View style={[styles.gaugeFill, { width: widthGreen, backgroundColor: 'rgba(34,197,94,0.8)' }]} />
      <Animated.View style={[styles.gaugeFill, { right: 0, width: widthRed, backgroundColor: 'rgba(239,68,68,0.8)' }]} />
      <View style={styles.gaugeTextWrap}><Text style={styles.gaugeText} allowFontScaling={false}>{current}/{target} kcal</Text></View>
    </View>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const nav = useNavigation()
  const { user } = useAuth()
  const [category, setCategory] = useState('normal')
  const [target, setTarget] = useState(1200)
  const [current, setCurrent] = useState(0)
  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') })

  const loadLocal = useCallback(async () => {
    const { target, current } = await initCalorieData(user?.id)
    setTarget(target)
    setCurrent(current)
  }, [user?.id])

  const applyPrefillCategory = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem('@avatar/category_prefill')
      if (v) {
        setCategory(v)
        await AsyncStorage.removeItem('@avatar/category_prefill')
      }
    } catch {}
  }, [])

  const syncFromProfile = useCallback(async () => {
    try {
      const prof = await apiGet('/api/profile')
      const t = prof?.targetCalories
      if (typeof t === 'number' && !Number.isNaN(t) && t > 0) {
        await setTargetCalories(t, user?.id)
        setTarget(t)
      }
      const w = prof?.weight
      const h = prof?.height
      if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
        const bmi = calcBMI(w, h)
        const cat = classifyBMI(bmi)
        setCategory(cat)
      }
    } catch {}
  }, [user?.id])

  const loadAll = useCallback(async () => {
    await applyPrefillCategory()
    await loadLocal()
    await syncFromProfile()
  }, [applyPrefillCategory, loadLocal, syncFromProfile])

  useEffect(() => { loadAll() }, [loadAll])
  useFocusEffect(useCallback(() => { loadAll() }, [loadAll]))

  if (!fontsLoaded) return null

  const IconLabeled = ({ iconSrc, label, to, onPress }) => (
    <Pressable onPress={onPress ?? (() => nav.navigate(to))} style={{ alignItems: 'center', width: ICON_SIZE + 8 }}>
      <Image source={iconSrc} style={{ width: ICON_SIZE, height: ICON_SIZE, resizeMode: 'contain' }} />
      <Text style={styles.labelText} numberOfLines={1} allowFontScaling={false}>{label}</Text>
    </Pressable>
  )

  return (
    <ImageBackground source={require('../../assets/background/home.png')} style={{ flex: 1 }} resizeMode="cover">
      <View style={[styles.topContainer, { marginTop: insets.top + 20 }]}>
        <Pressable style={styles.box} onPress={() => nav.navigate('DietLog')}>
          <Text style={styles.boxText} allowFontScaling={false}>🥗 식단 기록</Text>
        </Pressable>
        <Pressable style={styles.box} onPress={() => nav.navigate('Data')}>
          <Text style={styles.boxText} allowFontScaling={false}>👀 한눈에</Text>
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
            <IconLabeled iconSrc={require('../../assets/icons/profile.png')} label="PROFILE" to="Profile" />
            <IconLabeled iconSrc={require('../../assets/icons/quest.png')} label="QUEST" to="Quest" />
            <IconLabeled iconSrc={require('../../assets/icons/quest.png')} label="RANKING" to="Ranking" />
            <IconLabeled iconSrc={require('../../assets/icons/setting.png')} label="SETTINGS" to="Settings" />
          </View>
        </View>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  topContainer: { flexDirection: 'row', paddingHorizontal: 11, gap: 12 },
  box: {
    flex: 1,
    height: BOX_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 30,
    padding: BOX_PAD,
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  boxText: {
    fontSize: BOX_FONT,
    height: BOX_HEIGHT,
    color: '#333',
    fontFamily: FONT,
    includeFontPadding: false
  },
  gaugeContainer: { width: '65%', height: 20, borderWidth: 2, borderColor: 'black', borderRadius: 8, overflow: 'hidden' },
  gaugeFill: { position: 'absolute', top: 0, bottom: 0 },
  gaugeTextWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gaugeText: { color: 'gray', fontSize: 12, fontFamily: FONT, includeFontPadding: false },
  labelText: { fontSize: 18, marginTop: -8, fontFamily: FONT, color: 'tomato', includeFontPadding: false, textAlign: 'center'}
})

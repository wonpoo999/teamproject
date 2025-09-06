// >>> [ADDED] 복구 질문 설정 화면 (UI 뼈대만, 추후 폼 연결)
import React from 'react'
import { View, Text, StyleSheet, ImageBackground } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'

const FONT = 'DungGeunMo'

export default function RecoverySetup() {
  const insets = useSafeAreaInsets()
  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') })
  if (!fontsLoaded) return null

  return (
    <ImageBackground source={require('../../assets/background/home.png')} style={{ flex: 1 }} resizeMode="cover">
      <Text style={[styles.screenTitle, { top: insets.top + 8 }]}>RECOVERY</Text>
      <View style={[styles.center, { paddingTop: insets.top + 96 }]}>
        <Text style={styles.desc}>복구 질문 설정 화면입니다. (추후 폼 연결)</Text>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  screenTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#000',
    fontSize: 26,
    textShadowColor: 'rgba(255,255,255,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 10,
    fontFamily: FONT,
    fontWeight: 'normal',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  desc: { color: '#111', fontFamily: FONT, fontSize: 16 },
})

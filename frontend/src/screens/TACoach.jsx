import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Image, Dimensions, Pressable, TouchableOpacity, Platform } from 'react-native'
import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: W } = Dimensions.get('window')
const MODE_LABEL = { squat: '스쿼트', pushup: '푸쉬업' }
const TA_IMG = require('../../assets/char/ta.png')
const STORE_KEY = '@tts/voiceId'

function buildGreeting(mode = 'squat') {
  const h = new Date().getHours()
  const tod = h < 5 ? '새벽' : h < 12 ? '아침' : h < 18 ? '오후' : '저녁'
  const modeKo = MODE_LABEL[mode] || '운동'
  return `안녕! 나는 바벨몬 조교야. ${tod}에도 ${modeKo} 신나게 해보자!`
}

async function resolveVoice() {
  const saved = await AsyncStorage.getItem(STORE_KEY)
  if (saved) return saved
  try {
    const vs = await Speech.getAvailableVoicesAsync()
    const ko = (vs || []).filter(v => (v.language || '').toLowerCase().startsWith('ko'))
    const maleByGender = ko.find(v => String(v.gender || '').toLowerCase() === 'male')
    if (maleByGender) return maleByGender.identifier
    const maleByName = ko.find(v => /male|남성|man|min|male1|male2/i.test(String(v.name || '')))
    if (maleByName) return maleByName.identifier
    if (ko[0]?.identifier) return ko[0].identifier
    return null
  } catch {
    return null
  }
}

export default function TACoach({ route }) {
  const mode = route?.params?.mode || 'squat'
  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const lastSpoken = useRef(0)
  const [voiceId, setVoiceId] = useState(null)

  useEffect(() => {
    resolveVoice().then(setVoiceId)
    if (Platform.OS === 'android') Speech.speak('', { language: 'ko-KR' })
  }, [])

  function say(text, rate = 1.0) {
    if (!text) return
    Speech.stop()
    const opts = { language: 'ko-KR', rate }
    if (voiceId) opts.voice = voiceId
    else opts.pitch = 0.85
    Speech.speak(text, opts)
  }

  useEffect(() => {
    if (!running) return
    if (count > 0 && count !== lastSpoken.current) {
      lastSpoken.current = count
      say(`${count}개`)
    }
  }, [count, running])

  return (
    <View style={S.wrap}>
      <View style={S.charWrap}>
        <Image source={TA_IMG} style={S.charImg} resizeMode="contain" />
      </View>

      {!running && (
        <Pressable
          style={S.overlay}
          onPress={() => {
            setRunning(true)
            setCount(0)
            lastSpoken.current = 0
            say(buildGreeting(mode))
          }}
        >
          <Text style={S.ovTitle}>바벨몬 조교</Text>
          <Text style={S.ovHint}>탭해서 시작</Text>
        </Pressable>
      )}

      <View style={S.hud}>
        <Text style={S.badge}>{(MODE_LABEL[mode] || mode).toUpperCase()}</Text>
        <Text style={S.count}>{count}</Text>
        <View style={S.row}>
          <TouchableOpacity style={S.btn} onPress={() => setCount(c => c + 1)}>
            <Text style={S.btnTxt}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.btn, count === 0 && S.btnDisabled]} disabled={count === 0} onPress={() => setCount(c => Math.max(0, c - 1))}>
            <Text style={S.btnTxt}>-1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.btn, S.warn]} onPress={() => { setCount(0); lastSpoken.current = 0 }}>
            <Text style={S.btnTxt}>RESET</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const S = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  charWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  charImg: { width: W * 0.6, height: W * 0.6 },
  overlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  ovTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  ovHint: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hud: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  badge: { color: '#bbb', marginBottom: 8, fontWeight: '700' },
  count: { color: '#fff', fontSize: 56, fontWeight: '900', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111827', borderRadius: 10 },
  warn: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontWeight: '800' }
})

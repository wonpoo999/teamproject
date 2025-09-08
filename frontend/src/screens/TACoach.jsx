import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Image, Dimensions, Pressable, TouchableOpacity, Platform } from 'react-native'
import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: W } = Dimensions.get('window')
const MODE_LABEL = { squat: '스쿼트', pushup: '푸쉬업' }
const TA_IMG = require('../../assets/char/ta.png')
const STORE_KEY = '@tts/voiceId'

const SPICY = [
  '이 정도에 힘들면 엘리베이터도 운동이지요?',
  '킹받지? 그럼 한 개만 더.',
  '근손실이 전화했어요. 빨리 움직이라네요.',
  '오늘도 포기 전문가가 되실 건가요?',
  '운동은 마음이 아니라 몸으로 하는 겁니다.'
]
const pick = a => a[Math.floor(Math.random()*a.length)]

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
    const male = ko.find(v => String(v.gender || '').toLowerCase() === 'male') ||
                 ko.find(v => /male|남성|man|min|male1|male2/i.test(String(v.name || '')))
    return (male || ko[0])?.identifier || null
  } catch { return null }
}

export default function TACoach({ route }) {
  const mode = route?.params?.mode || 'squat'

  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const lastSpoken = useRef(0)
  const [voiceId, setVoiceId] = useState(null)

  const autoTimer = useRef(null)
  const tauntTimer = useRef(null)
  const [intervalMs, setIntervalMs] = useState(2000)

  useEffect(() => {
    resolveVoice().then(setVoiceId)
    if (Platform.OS === 'android') Speech.speak('', { language: 'ko-KR' })
    return () => {
      stopAuto()
      clearTaunt()
    }
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
      if (count % 12 === 0) say(pick(SPICY))
    }
  }, [count, running])

  function scheduleTaunt() {
    clearTaunt()
    const delay = 20000 + Math.floor(Math.random() * 15000)
    tauntTimer.current = setTimeout(() => {
      if (autoTimer.current) {
        say(pick(SPICY))
        scheduleTaunt()
      }
    }, delay)
  }
  function clearTaunt() {
    if (tauntTimer.current) { clearTimeout(tauntTimer.current); tauntTimer.current = null }
  }

  function startAuto() {
    if (autoTimer.current) return
    autoTimer.current = setInterval(() => setCount(c => c + 1), intervalMs)
    say('자동 카운트를 시작합니다.')
    scheduleTaunt()
  }
  function stopAuto() {
    if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null }
    clearTaunt()
  }

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

      <View style={S.ctrlWrap}>
        <View style={S.rowSmall}>
          <TouchableOpacity style={S.smallBtn} onPress={() => { setIntervalMs(ms => Math.max(700, ms - 300)); if (autoTimer.current) { stopAuto(); startAuto() } }}>
            <Text style={S.smallTxt}>빠르게</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.smallBtn} onPress={() => { setIntervalMs(2000); if (autoTimer.current) { stopAuto(); startAuto() } }}>
            <Text style={S.smallTxt}>보통</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.smallBtn} onPress={() => { setIntervalMs(ms => Math.min(4000, ms + 300)); if (autoTimer.current) { stopAuto(); startAuto() } }}>
            <Text style={S.smallTxt}>천천히</Text>
          </TouchableOpacity>
          {!autoTimer.current ? (
            <TouchableOpacity style={[S.smallBtn, S.green]} onPress={startAuto}>
              <Text style={S.smallTxt}>자동 시작</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[S.smallBtn, S.red]} onPress={stopAuto}>
              <Text style={S.smallTxt}>자동 정지</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          <TouchableOpacity style={[S.btn, S.warn]} onPress={() => { stopAuto(); setCount(0); lastSpoken.current = 0 }}>
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

  ctrlWrap: { position: 'absolute', left: 0, right: 0, bottom: 120, alignItems: 'center' },
  rowSmall: { flexDirection: 'row', gap: 8 },
  smallBtn: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  green: { backgroundColor: '#10b981' },
  red: { backgroundColor: '#ef4444' },
  smallTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  hud: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  badge: { color: '#bbb', marginBottom: 8, fontWeight: '700' },
  count: { color: '#fff', fontSize: 56, fontWeight: '900', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111827', borderRadius: 10 },
  warn: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontWeight: '800' }
})

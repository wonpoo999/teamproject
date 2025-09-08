import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Platform } from 'react-native'
import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: W, height: H } = Dimensions.get('window')

const MODE_LABEL_KO = { squat: '스쿼트', pushup: '푸쉬업' }
const MODE_LABEL_EN = { squat: 'SQUAT', pushup: 'PUSH-UP' }

const TA_IMG = require('../../assets/char/ta.png')
const STORE_KEY = '@tts/voiceId'

const SPICY = [
  '이 정도에 힘들면 엘리베이터도 운동이지요?',
  '킹받지? 그럼 한 개만 더.',
  '근손실이 전화했어요. 빨리 움직이라네요.',
  '오늘도 포기 전문가가 되실 건가요?',
  '운동은 마음이 아니라 몸으로 하는 겁니다.',
]
const pick = a => a[Math.floor(Math.random() * a.length)]

function buildGreeting(mode = 'squat') {
  const h = new Date().getHours()
  const tod = h < 5 ? '새벽' : h < 12 ? '아침' : h < 18 ? '오후' : '저녁'
  const modeKo = MODE_LABEL_KO[mode] || '운동'
  return `안녕하세요! 저는 바벨몬 트레이너에요. ${tod}에도 ${modeKo} 신나게 해봐요!`
}

async function resolveVoice() {
  const saved = await AsyncStorage.getItem(STORE_KEY)
  if (saved) return saved
  try {
    const vs = await Speech.getAvailableVoicesAsync()
    const ko = (vs || []).filter(v => (v.language || '').toLowerCase().startsWith('ko'))
    const male =
      ko.find(v => String(v.gender || '').toLowerCase() === 'male') ||
      ko.find(v => /male|남성|man|min|male1|male2/i.test(String(v.name || '')))
    return (male || ko[0])?.identifier || null
  } catch { return null }
}

export default function TACoach({ route }) {
  const mode = route?.params?.mode || 'squat'

  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const [voiceId, setVoiceId] = useState(null)

  // 속도 고정(천천히)
  const intervalMs = 3000

  const lastSpoken = useRef(0)
  const autoTimer = useRef(null)
  const tauntTimer = useRef(null)

  const q = useRef([]); const speaking = useRef(false)
  const lastTauntAt = useRef(0); const TAUNT_COOLDOWN_MS = 12000
  function ttsEnqueue(text, rate = 1.0) {
    if (!text) return; q.current.push({ text, rate }); processQueue()
  }
  function processQueue() {
    if (speaking.current) return
    const job = q.current.shift(); if (!job) return
    speaking.current = true
    const opts = { language: 'ko-KR', rate: job.rate, onDone: handleDone, onStopped: handleDone, onError: handleDone }
    if (voiceId) opts.voice = voiceId; else opts.pitch = 0.85
    Speech.speak(job.text, opts)
  }
  function handleDone(){ speaking.current = false; processQueue() }
  function ttsStopAll(){ q.current = []; speaking.current = false; Speech.stop() }

  useEffect(() => {
    resolveVoice().then(setVoiceId)
    if (Platform.OS === 'android') Speech.speak('', { language: 'ko-KR', onDone: () => Speech.stop() })
    return () => { stopAuto(); clearTaunt(); ttsStopAll() }
  }, [])

  useEffect(() => {
    if (!running) return
    if (count > 0 && count !== lastSpoken.current) {
      lastSpoken.current = count
      ttsEnqueue(`${count}개`)
      const now = Date.now()
      if (count % 12 === 0 && now - lastTauntAt.current > TAUNT_COOLDOWN_MS) {
        lastTauntAt.current = now
        ttsEnqueue(pick(SPICY))
      }
    }
  }, [count, running])

  function scheduleTaunt() {
    clearTaunt()
    const delay = 20000 + Math.floor(Math.random() * 15000)
    tauntTimer.current = setTimeout(() => {
      if (autoTimer.current) {
        const now = Date.now()
        if (now - lastTauntAt.current > TAUNT_COOLDOWN_MS) {
          lastTauntAt.current = now
          ttsEnqueue(pick(SPICY))
        }
        scheduleTaunt()
      }
    }, delay)
  }
  function clearTaunt(){ if (tauntTimer.current){ clearTimeout(tauntTimer.current); tauntTimer.current = null } }

  function startAuto() {
    if (autoTimer.current) return
    setRunning(true)
    lastSpoken.current = 0
    ttsStopAll()
    ttsEnqueue(buildGreeting(mode))
    autoTimer.current = setInterval(() => setCount(c => c + 1), intervalMs)
    ttsEnqueue('자동 카운트를 시작합니다.')
    scheduleTaunt()
  }
  function stopAuto() {
    if (autoTimer.current){ clearInterval(autoTimer.current); autoTimer.current = null }
    setRunning(false)
    clearTaunt()
  }

  return (
    <View style={S.wrap}>
      {/* 상단 중앙 모드 텍스트 (조금 아래로) */}
      <View style={S.topCenter}>
        <View style={S.modePill}>
          <Text style={S.modeTxt}>{(MODE_LABEL_EN[mode] || mode).toUpperCase()}</Text>
        </View>
      </View>

      {/* 캐릭터 */}
      <View style={S.charWrap}>
        <Image source={TA_IMG} style={S.charImg} resizeMode="contain" />
      </View>

      {/* 카운트: 배경 제거, 글로우만 */}
      <View style={S.countWrap}>
        <Text style={S.countGlow}>{count}</Text>
        <Text style={S.count}>{count}</Text>
        <Text style={S.countUnit}>REPS</Text>
      </View>

      {/* 컨트롤 버튼 */}
      <View style={S.bottomRow}>
        <TouchableOpacity
          style={[S.ctrlBtn, S.resetBtn]}
          onPress={() => { stopAuto(); setCount(0); lastSpoken.current = 0; ttsStopAll() }}
        >
          <Text style={S.ctrlTxt}>RESET</Text>
        </TouchableOpacity>

        {running ? (
          <TouchableOpacity style={[S.ctrlBtn, S.pauseBtn]} onPress={stopAuto}>
            <Text style={S.ctrlTxt}>PAUSE</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[S.ctrlBtn, S.startBtn]} onPress={startAuto}>
            <Text style={S.ctrlTxt}>START</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const S = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#05060a' },

  // 상단 중앙 배치 (노치/상태바와 겹치지 않게 살짝 내림)
  topCenter: {
    position: 'absolute',
    top: 28,                 // ← 필요하면 32~40으로 더 내려도 OK
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  modePill: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  modeTxt: {
    color: '#e8e8ea', fontSize: 22, letterSpacing: 4, fontFamily: 'DungGeunMo',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },

  // 캐릭터
  charWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  charImg: { width: W * 0.78, height: Math.min(W * 0.9, H * 0.5) },

  // 카운트(배경 없음)
  countWrap: { position: 'absolute', left: 0, right: 0, bottom: 128, alignItems: 'center' },
  countGlow: {
    position: 'absolute',
    fontSize: 94, fontWeight: '900', fontFamily: 'DungGeunMo',
    color: 'transparent',
    textShadowColor: 'rgba(59,130,246,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  count: {
    color: '#fff', fontSize: 86, fontWeight: '900', fontFamily: 'DungGeunMo', letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6,
  },
  countUnit: {
    marginTop: 8,
    color: '#cbd5e1', fontSize: 12, opacity: 0.9, fontFamily: 'DungGeunMo', letterSpacing: 2,
  },

  // 버튼
  bottomRow: {
    position: 'absolute', left: 0, right: 0, bottom: 36,
    flexDirection: 'row', gap: 12, justifyContent: 'center',
  },
  ctrlBtn: {
    minWidth: 120, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    ...(Platform.OS === 'android' ? { elevation: 4 } : null),
  },
  ctrlTxt: { color: '#fff', fontWeight: '800', fontFamily: 'DungGeunMo', letterSpacing: 2 },
  startBtn: { backgroundColor: '#10b981', borderWidth: 1, borderColor: 'rgba(16,185,129,0.7)' },
  pauseBtn: { backgroundColor: '#334155', borderWidth: 1, borderColor: 'rgba(148,163,184,0.5)' },
  resetBtn: { backgroundColor: '#ef4444', borderWidth: 1, borderColor: 'rgba(239,68,68,0.7)' },
})

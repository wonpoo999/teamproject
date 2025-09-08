import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Image, Dimensions, Pressable, TouchableOpacity, Platform } from 'react-native'
import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Voice from '@react-native-voice/voice'

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

function pick(a){return a[Math.floor(Math.random()*a.length)]}

function buildGreeting(mode = 'squat') {
  const h = new Date().getHours()
  const tod = h < 5 ? '새벽' : h < 12 ? '아침' : h < 18 ? '오후' : '저녁'
  const modeKo = MODE_LABEL[mode] || '운동'
  return `안녕! 나는 바벨몬 조교야. ${tod}에도 ${modeKo} 신나게 해보자!`
}

function formTip(mode, kw = '') {
  const k = kw || ''
  if (mode === 'squat') {
    if (/무릎/.test(k)) return '무릎은 발끝 방향으로, 안쪽으로 붕괴되지 않게 하세요.'
    if (/허리|코어/.test(k)) return '허리는 중립을 유지하고, 배에 힘을 주어 코어를 단단히 조이세요.'
    if (/발|스탠스|서/.test(k)) return '발은 어깨너비, 발끝은 5~15도로 살짝 바깥. 체중은 발뒤꿈치와 중간에 두세요.'
    if (/깊이|하강|앉/.test(k)) return '엉덩이를 뒤로 보내며 앉고, 허벅지가 지면과 평행 정도까지 내려오면 좋습니다.'
    if (/호흡|숨/.test(k)) return '내려갈 때 들이마시고, 올라오며 내쉬세요.'
    return '발은 어깨너비, 발끝 10도. 허리는 중립, 무릎은 발끝 방향. 엉덩이를 뒤로 빼며 앉고, 올라오며 내쉬세요.'
  } else {
    if (/팔꿈치|각도/.test(k)) return '팔꿈치는 몸통에서 약 45도. 옆으로 퍼지지 않게 하세요.'
    if (/어깨/.test(k)) return '어깨가 말리지 않게 가슴을 열고 견갑을 살짝 아래로 당겨 안정화하세요.'
    if (/몸통|허리|코어|라인/.test(k)) return '머리부터 발뒤꿈치까지 일직선. 코어와 엉덩이를 조여 허리가 꺾이지 않게 하세요.'
    if (/손|너비|스탠스/.test(k)) return '손은 어깨보다 약간 넓게, 손목은 팔꿈치와 수직이 되게 놓으세요.'
    if (/깊이|하강|가슴/.test(k)) return '가슴이 바닥과 5~10센티 정도까지 내려오게 하고, 올라올 때 팔을 완전히 펴세요.'
    if (/호흡|숨/.test(k)) return '내려갈 때 들이마시고, 올라오며 내쉬세요.'
    return '손은 어깨보다 약간 넓게, 팔꿈치 45도. 몸은 일직선 유지, 가슴을 바닥 가까이 내렸다가 팔을 완전히 펴세요.'
  }
}

async function resolveVoice() {
  const saved = await AsyncStorage.getItem(STORE_KEY)
  if (saved) return saved
  try {
    const vs = await Speech.getAvailableVoicesAsync()
    const ko = (vs || []).filter(v => (v.language || '').toLowerCase().startsWith('ko'))
    const byGender = ko.find(v => String(v.gender || '').toLowerCase() === 'male')
    if (byGender) return byGender.identifier
    const byName = ko.find(v => /male|남성|man|min|male1|male2/i.test(String(v.name || '')))
    if (byName) return byName.identifier
    return ko[0]?.identifier || null
  } catch { return null }
}

export default function TACoach({ route }) {
  const mode = route?.params?.mode || 'squat'

  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const lastSpoken = useRef(0)
  const [voiceId, setVoiceId] = useState(null)

  const [listening, setListening] = useState(false)
  const continuousRef = useRef(false)
  const lastCmdRef = useRef('')
  const autoTimer = useRef(null)
  const [intervalMs, setIntervalMs] = useState(2000)

  useEffect(() => {
    resolveVoice().then(setVoiceId)
    if (Platform.OS === 'android') Speech.speak('', { language: 'ko-KR' })

    Voice.onSpeechResults = e => {
      const t = (e?.value && e.value[0] && String(e.value[0]).trim()) || ''
      if (!t) return
      if (t === lastCmdRef.current) return
      lastCmdRef.current = t
      handleCommand(t)
    }
    Voice.onSpeechError = () => {
      setListening(false)
      if (continuousRef.current) restartListen()
    }
    Voice.onSpeechEnd = () => {
      setListening(false)
      if (continuousRef.current) restartListen()
    }

    return () => {
      try { Voice.destroy().then(Voice.removeAllListeners) } catch {}
      stopAuto()
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

  function sayLater(text, ms = 600) {
    setTimeout(() => say(text), ms)
  }

  useEffect(() => {
    if (!running) return
    if (count > 0 && count !== lastSpoken.current) {
      lastSpoken.current = count
      say(`${count}개`)
    }
  }, [count, running])

  function startAuto() {
    if (autoTimer.current) return
    autoTimer.current = setInterval(() => setCount(c => c + 1), intervalMs)
    say('자동 카운트를 시작합니다.')
  }
  function stopAuto() {
    if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null }
  }

  async function startListen() {
    try {
      await Voice.start('ko-KR', { EXTRA_PARTIAL_RESULTS: true })
      setListening(true)
    } catch {}
  }
  async function stopListen() {
    try { await Voice.stop() } catch {}
    setListening(false)
  }
  async function restartListen() {
    setTimeout(() => startListen(), 250)
  }

  async function toggleListenContinuous() {
    if (continuousRef.current) {
      continuousRef.current = false
      await stopListen()
      say('듣기를 종료합니다.')
    } else {
      continuousRef.current = true
      await startListen()
      say('연속 듣기를 시작합니다.')
    }
  }

  function handleCommand(textRaw) {
    const text = (textRaw || '').trim()
    if (!text) return

    if (/(자동\s*카운트|카운트\s*시작|시작)/i.test(text)) { startAuto(); return }
    if (/(멈춰|정지|스탑|중지|그만)/i.test(text)) { stopAuto(); say('중지했어요.'); return }
    if (/(리셋|초기화)/i.test(text)) { stopAuto(); setCount(0); lastSpoken.current = 0; say('카운트를 리셋했습니다.'); return }
    if (/(빠르게|빨리)/i.test(text)) { setIntervalMs(1000); if (autoTimer.current) { stopAuto(); startAuto() } say('빠르게 진행할게요.'); return }
    if (/(보통|기본)/i.test(text)) { setIntervalMs(2000); if (autoTimer.current) { stopAuto(); startAuto() } say('보통 속도로 진행합니다.'); return }
    if (/(천천히|느리게)/i.test(text)) { setIntervalMs(3000); if (autoTimer.current) { stopAuto(); startAuto() } say('천천히 진행할게요.'); return }
    if (/(\d+)\s*개\s*(더|추가)/.test(text)) { const n = Number(text.match(/(\d+)\s*개/)[1]); setCount(c => c + n); return }
    if (/(한\s*개\s*더|플러스|추가)/.test(text)) { setCount(c => c + 1); return }
    if (/(\d+)\s*개\s*(빼|감소|마이너스)/.test(text)) { const n = Number(text.match(/(\d+)\s*개/)[1]); setCount(c => Math.max(0, c - n)); return }
    if (/(빼|감소|마이너스)/.test(text)) { setCount(c => Math.max(0, c - 1)); return }

    if (/(자세|폼|어떻게|방법)/i.test(text)) {
      const kw = (text.match(/무릎|허리|코어|어깨|팔꿈치|손|손목|깊이|하강|가슴|발|스탠스|라인|호흡/) || [null])[0] || ''
      say(formTip(mode, kw))
      return
    }

    if (/(힘들|지쳤|쉬고|휴식)/i.test(text)) {
      stopAuto()
      say('좋아요. 잠깐 숨을 고르세요.')
      sayLater(pick(SPICY), 900)
      return
    }

    say('좋습니다. 호흡을 내쉬며 동작을 마무리하세요.')
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

      <View style={S.micWrap}>
        <TouchableOpacity onPress={toggleListenContinuous} style={[S.micBtn, (continuousRef.current || listening) && S.micOn]}>
          <Text style={S.micTxt}>{continuousRef.current ? '듣는 중… (연속)' : '🎤 연속 듣기 켜기'}</Text>
        </TouchableOpacity>
        <View style={S.rowSmall}>
          <TouchableOpacity style={S.smallBtn} onPress={() => setIntervalMs(ms => Math.max(700, ms - 300))}>
            <Text style={S.smallTxt}>빠르게</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.smallBtn} onPress={() => setIntervalMs(2000)}>
            <Text style={S.smallTxt}>보통</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.smallBtn} onPress={() => setIntervalMs(ms => Math.min(4000, ms + 300))}>
            <Text style={S.smallTxt}>천천히</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.smallBtn, S.green]} onPress={startAuto}>
            <Text style={S.smallTxt}>자동 시작</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.smallBtn, S.red]} onPress={stopAuto}>
            <Text style={S.smallTxt}>자동 정지</Text>
          </TouchableOpacity>
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

  micWrap: { position: 'absolute', left: 0, right: 0, bottom: 120, alignItems: 'center', gap: 10 },
  micBtn: { backgroundColor: '#111827', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  micOn: { backgroundColor: '#2563eb' },
  micTxt: { color: '#fff', fontWeight: '800' },
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

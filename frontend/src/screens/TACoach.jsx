// TACoach.js — ✅ 최종본
import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Platform } from 'react-native'
import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useI18n } from '../i18n/I18nContext' // [ADDED] i18n 사용

const { width: W, height: H } = Dimensions.get('window')

// [CHANGED] 모드 라벨을 언어별로 제공
const MODE_LABEL = {
  squat: { ko: '스쿼트', en: 'SQUAT', ja: 'スクワット', zh: '深蹲' },
  pushup: { ko: '푸쉬업', en: 'PUSH-UP', ja: 'プッシュアップ', zh: '俯卧撑' },
}

const TA_IMG = require('../../assets/char/ta.png')
const STORE_KEY = '@tts/voiceId'

// [ADDED] 언어별 격려/도발 대사
const MOTIVATE_MAP = {
  ko: [
    '좋아요! 이렇게 꾸준히 하면 금방 늘어요.',
    '한 개씩 차근차근, 잘 하고 있어요!',
    '운동하는 모습 멋져요, 계속 가요!',
    '지금처럼만 하면 목표 금방 도달할 거예요.',
    '조금만 더, 분명히 성장하고 있어요!',
    '꾸준함이 근육을 만듭니다. 잘하고 있어요!',
    '포기하지 않는 게 제일 큰 힘이에요!',
    '호흡 일정하게, 지금 완벽해요!',
    '몸이 점점 강해지고 있어요, 느껴지죠?',
    '한 번 더! 그게 오늘의 차이를 만듭니다.',
    '힘든 만큼 보상은 크게 돌아와요.',
    '오늘도 자신과의 약속을 지키고 있네요!',
    '운동은 배신하지 않아요. 계속해요!',
    '조금 힘들어도 내일의 나를 위해 가는 거예요.',
    '멋진 페이스예요, 끝까지 화이팅!',
  ],
  en: [
    "Nice! Keep this up and you'll improve fast.",
    "One rep at a time — you're doing great!",
    "You look awesome working out. Keep going!",
    "At this pace, you'll hit your goal soon.",
    "A little more — you're definitely growing!",
    "Consistency builds muscle. Great work!",
    "Not giving up is your biggest strength!",
    "Keep breathing steady — perfect form!",
    "Your body’s getting stronger. Feel it?",
    "One more! That’s what makes today different.",
    "The harder it is, the bigger the reward.",
    "You’re keeping your promise to yourself!",
    "Training never betrays. Keep at it!",
    "Tough now, but tomorrow’s you will thank you.",
    "Great pace — finish strong!",
  ],
  ja: [
    'いいね！ 続ければすぐに成長しますよ。',
    '一回ずつ着実に、よくできています！',
    '運動している姿、かっこいい！続けましょう！',
    'この調子ならすぐに目標に届きます。',
    'あと少し、確実に成長しています！',
    '継続は筋肉なり。いい感じです！',
    '諦めないことが一番の力です！',
    '呼吸を整えて、そのまま完璧！',
    '体がどんどん強くなっています、感じますか？',
    'もう一回！それが今日の差になります。',
    '大変な分、報酬は大きく返ってきます。',
    '今日も自分との約束を守っていますね！',
    '運動は裏切りません。続けましょう！',
    '少し辛くても明日の自分のために！',
    'いいペース、最後までファイト！',
  ],
  zh: [
    '很好！坚持下去很快就会进步。',
    '一步一步来，你做得很棒！',
    '你训练的样子很帅，继续！',
    '保持这样，很快就能达成目标。',
    '再坚持一下，你真的在成长！',
    '坚持才会长肌肉，你做得很好！',
    '不放弃就是你最大的力量！',
    '保持呼吸稳定，现在的状态很完美！',
    '身体越来越强壮了，感觉到了吗？',
    '再来一次！这就是今天的不同之处。',
    '越辛苦，回报越大。',
    '今天也在守住对自己的约定！',
    '训练从不背叛，坚持！',
    '再辛苦也是为了明天的你！',
    '节奏很好，坚持到最后！',
  ],
}

const SPICY_MAP = {
  ko: [
    '이 정도에 힘들면 엘리베이터도 운동이지요?',
    '킹받지? 그럼 한 개만 더.',
    '근손실이 전화했어요. 빨리 움직이라네요.',
    '오늘도 포기 전문가가 되실 건가요?',
    '운동은 마음이 아니라 몸으로 하는 겁니다.',
    '이 속도로는 군고구마도 다 타겠다.',
    '땀 좀 흘려봐요, 눈물 말고요.',
    '지금 멈추면 내일 더 하기 싫을 텐데요?',
    '헬스장 대신 침대랑 계약했나요?',
    '근육은 배신 안 해요, 대신 의자랑 친해지겠죠.',
    '앉아 있는 게 더 편하죠? 그게 문제예요.',
    '몸이 아니라 변명만 성장 중이네요?',
    '운동은 공짜지만 후회는 유료입니다.',
    '운동 중 포기? 오늘도 의자 MVP!',
    '열정은 어디 두고 오신 거예요?',
    '거울이랑 눈 못 마주치게 될걸요?',
  ],
  en: [
    "If this is hard, even elevators count as exercise?",
    "Triggered? Then just one more.",
    "Muscle loss just called — move now.",
    "Training to be a quitting expert again?",
    "Exercise is done with the body, not the mind.",
    "At this pace, even sweet potatoes would burn.",
    "Sweat a little — not tears.",
    "Stop now and you’ll hate it more tomorrow.",
    "Signed with your bed instead of the gym?",
    "Muscles won’t betray you, chairs will love you.",
    "Sitting feels better, right? That’s the problem.",
    "Your excuses are growing, not your body.",
    "Exercise is free; regret is expensive.",
    "Quitting mid-workout? Chair MVP again!",
    "Where did you leave your passion?",
    "You won’t meet your eyes in the mirror soon.",
  ],
  ja: [
    'これで辛いなら、エレベーターも運動だね？',
    'イラッとした？ じゃあもう一回。',
    '筋肉減少から電話きたよ。早く動けって。',
    '今日も諦めのプロになるの？',
    '運動は心じゃなく体でするんだよ。',
    'このペースじゃ焼き芋も焦げちゃうよ。',
    '涙じゃなく汗をかこう。',
    '今止めたら明日はもっと嫌になるよ。',
    'ジムじゃなくベッドと契約したの？',
    '筋肉は裏切らないけど、椅子とは親友になるね。',
    '座ってる方が楽でしょ？ それが問題。',
    '育ってるのは体じゃなく言い訳だね。',
    '運動は無料、後悔は有料。',
    '運動中に諦め？ 今日も椅子がMVP！',
    '情熱はどこに置いてきたの？',
    '鏡と目を合わせられなくなるよ。',
  ],
  zh: [
    '这都嫌累？那电梯也算运动吧？',
    '生气了？那就再来一下。',
    '“肌肉流失”打电话来了，叫你快动！',
    '今天也要做放弃专家吗？',
    '运动不是靠心，而是靠身体。',
    '这个速度连红薯都会烤糊。',
    '流点汗吧，不要流泪。',
    '现在停，明天会更讨厌。',
    '签的是床，不是健身房吧？',
    '肌肉不背叛，但椅子会更爱你。',
    '坐着更舒服吧？这就是问题。',
    '长大的不是身体，而是借口。',
    '运动免费，后悔很贵。',
    '中途放弃？今天椅子又是MVP！',
    '热情丢哪了？',
    '很快你就不敢直视镜子里的自己。',
  ],
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// [ADDED] 언어별 인사 + 시간대
function buildGreeting(mode = 'squat', lang = 'ko') {
  const h = new Date().getHours()
  const tod = (l => {
    if (l === 'en') return h < 5 ? 'early morning' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
    if (l === 'ja') return h < 5 ? '早朝' : h < 12 ? '朝' : h < 18 ? '午後' : '夜'
    if (l === 'zh') return h < 5 ? '清晨' : h < 12 ? '早上' : h < 18 ? '下午' : '晚上'
    return h < 5 ? '새벽' : h < 12 ? '아침' : h < 18 ? '오후' : '저녁'
  })(lang)

  const modeName = MODE_LABEL[mode]?.[lang] || MODE_LABEL.squat[lang] || 'WORKOUT'
  if (lang === 'en') return `Hi! I'm your Barbelmon trainer. Let's enjoy ${modeName.toLowerCase()} this ${tod}!`
  if (lang === 'ja') return `こんにちは！ バーベルモンのトレーナーです。${tod}も${modeName}を楽しくやりましょう！`
  if (lang === 'zh') return `你好！我是杠铃蒙教练。这个${tod}一起开心地做${modeName}吧！`
  return `안녕하세요! 바벨몬 트레이너에요. ${tod}에도 ${modeName} 신나게 해봐요!`
}

// [CHANGED] 저장된 보이스 우선 사용 + 기본 언어 매핑
function langToSpeechLocale(lang) {
  if (lang === 'en') return 'en-US'
  if (lang === 'ja') return 'ja-JP'
  if (lang === 'zh') return 'zh-CN'
  return 'ko-KR'
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
  const target = route?.params?.target // (참고: 필요시 사용할 수 있도록 남김)

  const { t, lang } = useI18n() // [ADDED] 언어/번역 사용

  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const [voiceId, setVoiceId] = useState(null)

  const intervalMs = 3000

  // [CHANGED] 톤 라벨 언어화
  const TONES = ['soft', 'hard', 'mix']
  const TONE_LABEL = {
    soft: { ko: '소프트', en: 'Soft', ja: 'ソフト', zh: '柔和' },
    hard: { ko: '하드', en: 'Hard', ja: 'ハード', zh: '强硬' },
    mix:  { ko: '믹스', en: 'Mix',  ja: 'ミックス', zh: '混合' },
  }
  const TONE_TITLE = { ko: '톤', en: 'Tone', ja: 'トーン', zh: '音色' }
  const UI = {
    reps:  { ko: '반복',   en: 'REPS',  ja: '回数',   zh: '次数' },
    reset: { ko: '리셋',   en: 'RESET', ja: 'リセット', zh: '重置' },
    pause: { ko: '일시정지', en: 'PAUSE', ja: '一時停止', zh: '暂停' },
    start: { ko: '시작',   en: 'START', ja: '開始',   zh: '开始' },

    autoStart: {
      ko: '자동 카운트를 시작합니다.',
      en: 'Starting auto counting.',
      ja: '自動カウントを開始します。',
      zh: '开始自动计数。',
    },
    switchedTo: { // "{tone} 톤으로 전환"
      ko: (s) => `${s} 톤으로 전환`,
      en: (s) => `Switched to ${s} tone`,
      ja: (s) => `${s} トーンに切り替え`,
      zh: (s) => `切换为 ${s} 音色`,
    },
  }

  const [toneIdx, setToneIdx] = useState(0)
  const toneRef = useRef(TONES[0])

  useEffect(() => { toneRef.current = TONES[toneIdx] }, [toneIdx])

  function pickMotivate(l) {
    return pick(MOTIVATE_MAP[l] || MOTIVATE_MAP.ko)
  }
  function pickSpicy(l) {
    return pick(SPICY_MAP[l] || SPICY_MAP.ko)
  }

  function pickLineByTone() {
    const t = toneRef.current
    if (t === 'soft') return pickMotivate(lang)           // [CHANGED] 언어 적용
    if (t === 'hard') return pickSpicy(lang)              // [CHANGED]
    return Math.random() < 0.5 ? pickMotivate(lang) : pickSpicy(lang) // [CHANGED]
  }

  const loopOn = useRef(false)
  const timeoutRef = useRef(null)
  const countRef = useRef(0)
  const lastTauntAt = useRef(0)
  const startedOnceRef = useRef(false)
  const TAUNT_COOLDOWN_MS = 12000

  function speak(text, rate = 1.0) {
    return new Promise(resolve => {
      const opts = {
        language: langToSpeechLocale(lang), // [CHANGED] 현재 언어로 발화
        rate,
        onDone: resolve,
        onStopped: resolve,
        onError: resolve,
      }
      if (voiceId) opts.voice = voiceId
      else opts.pitch = 0.9
      Speech.speak(text, opts)
    })
  }

  function clearTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  async function loop() {
    if (!loopOn.current) return
    const next = countRef.current + 1
    setCount(next)
    countRef.current = next

    const t0 = Date.now()
    await speak(String(next), 1.03) // [CHANGED] 숫자만 각 언어로 읽힘
    const numberDur = Date.now() - t0

    const now = Date.now()
    if (next % 12 === 0 && now - lastTauntAt.current > TAUNT_COOLDOWN_MS) {
      lastTauntAt.current = now
      await speak(pickLineByTone(), 1.0)
    }

    const rest = Math.max(0, intervalMs - numberDur)
    timeoutRef.current = setTimeout(loop, rest)
  }

  async function startAuto() {
    if (loopOn.current) return
    loopOn.current = true
    clearTimer()
    try { Speech.stop() } catch {}
    if (!startedOnceRef.current) {
      startedOnceRef.current = true
      await speak(buildGreeting(mode, lang), 1.0)     // [CHANGED] 인사말 다국어
      await speak(UI.autoStart[lang] || UI.autoStart.ko, 1.0)
    }
    loop()
    setRunning(true)
  }

  function stopAuto() {
    loopOn.current = false
    clearTimer()
    try { Speech.stop() } catch {}
    setRunning(false)
  }

  function cycleTone() {
    const next = (toneIdx + 1) % TONES.length
    setToneIdx(next)
    const toneName = (TONE_LABEL[TONES[next]]?.[lang]) || TONE_LABEL[TONES[next]]?.ko
    if (running) speak((UI.switchedTo[lang] || UI.switchedTo.ko)(toneName), 1.0)
  }

  useEffect(() => {
    resolveVoice().then(setVoiceId)
    if (Platform.OS === 'android') {
      // 안드로이드 초기 TTS warm-up
      Speech.speak('', { language: langToSpeechLocale(lang), onDone: () => Speech.stop() })
    }
    return () => { stopAuto() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]) // [ADDED] 언어 변경 시 보이스/locale 재세팅

  const toneLabel = (TONE_LABEL[TONES[toneIdx]]?.[lang]) || TONE_LABEL[TONES[toneIdx]]?.ko
  const toneTitle = TONE_TITLE[lang] || TONE_TITLE.ko
  const modeTitle = (MODE_LABEL[mode]?.[lang] || MODE_LABEL.squat[lang] || 'WORKOUT').toUpperCase()
  const repsText = UI.reps[lang] || UI.reps.ko
  const resetText = UI.reset[lang] || UI.reset.ko
  const pauseText = UI.pause[lang] || UI.pause.ko
  const startText = UI.start[lang] || UI.start.ko

  return (
    <View style={S.wrap}>
      {/* 상단 모드 + 톤 */}
      <View style={S.topCenter}>
        <View style={S.modePill}>
          <Text style={S.modeTxt}>{modeTitle}</Text>
        </View>
        <TouchableOpacity onPress={cycleTone} style={S.tonePill}>
          <Text style={S.toneLabel}>{toneTitle}</Text>
          <Text style={S.toneValue}>{toneLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* 캐릭터 */}
      <View style={S.charWrap}>
        <Image source={TA_IMG} style={S.charImg} resizeMode="contain" />
      </View>

      {/* 카운트 */}
      <View style={S.countWrap}>
        <Text style={S.countGlow}>{count}</Text>
        <Text style={S.count}>{count}</Text>
        <Text style={S.countUnit}>{repsText}</Text>
      </View>

      {/* 하단 컨트롤 */}
      <View style={S.bottomRow}>
        <TouchableOpacity
          style={[S.ctrlBtn, S.resetBtn]}
          onPress={() => { stopAuto(); setCount(0); countRef.current = 0; startedOnceRef.current = false }}
        >
          <Text style={S.ctrlTxt}>{resetText}</Text>
        </TouchableOpacity>
        {running ? (
          <TouchableOpacity style={[S.ctrlBtn, S.pauseBtn]} onPress={stopAuto}>
            <Text style={S.ctrlTxt}>{pauseText}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[S.ctrlBtn, S.startBtn]} onPress={startAuto}>
            <Text style={S.ctrlTxt}>{startText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const S = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#05060a' },
  topCenter: { position: 'absolute', top: 28, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  modePill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  modeTxt: {
    color: '#e8e8ea', fontSize: 22, letterSpacing: 4, fontFamily: 'DungGeunMo',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  tonePill: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)',
  },
  toneLabel: { color: '#c7d2fe', fontSize: 12, fontFamily: 'DungGeunMo', opacity: 0.9, letterSpacing: 1 },
  toneValue: {
    color: '#93c5fd', fontSize: 14, fontFamily: 'DungGeunMo', letterSpacing: 1,
    textShadowColor: 'rgba(147,197,253,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
  },
  charWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  charImg: { width: W * 0.78, height: Math.min(W * 0.9, H * 0.5) },
  countWrap: { position: 'absolute', left: 0, right: 0, bottom: 128, alignItems: 'center' },
  countGlow: {
    position: 'absolute', fontSize: 94, fontWeight: '900', fontFamily: 'DungGeunMo',
    color: 'transparent', textShadowColor: 'rgba(59,130,246,0.45)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22,
  },
  count: {
    color: '#fff', fontSize: 86, fontWeight: '900', fontFamily: 'DungGeunMo', letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6,
  },
  countUnit: { marginTop: 8, color: '#cbd5e1', fontSize: 12, opacity: 0.9, fontFamily: 'DungGeunMo', letterSpacing: 2 },
  bottomRow: { position: 'absolute', left: 0, right: 0, bottom: 36, flexDirection: 'row', gap: 12, justifyContent: 'center' },
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

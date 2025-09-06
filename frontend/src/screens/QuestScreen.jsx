import { useEffect, useRef, useState } from 'react'
import { View, Text, ImageBackground, StyleSheet, Animated, Platform, AppState, Linking, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts } from 'expo-font'
import { useI18n } from '../i18n/I18nContext' // >>> [ADDED]
import { apiGet } from '../config/api' // >>> [ADDED] 체격 읽어와 난이도 반영

const FONT = 'DungGeunMo'

const TAUNTS = {
  none: ['0.00km… 산책 앱을 켰는데 산책은 안 함','첫 좌표에서 평생 살 계획?','오늘도 바닥이랑 베프네','다리는 절전 모드, 폰만 고성능','앉아있는 재능 국가대표'],
  low: ['워밍업 끝? 이제 진짜 이동은 언제?','편의점 왕복이 오늘의 하이라이트?','GPS가 울어요 “움직여줘…”','지구 둘레 4만km 중 0.1도 못 채웠다','발 대신 손가락만 운동하는 중'],
  mid: ['반도 안 왔는데 숨 먼저 참네','속도 이대로면 달팽이도 추월하겠다','물 마셨지? 이제 걸어라 인간','지도 확대하면 길긴 길어 보이긴 함','오늘도 “산책의 추억(구라)” 제작 중'],
  near: ['코앞에서 멈추면 구경꾼 인증','결승선 보이는데 브레이크 밟는 재주 무엇','끝까지 가면 칭찬… 받을 수도 말 수도','여기서 멈추면 오늘 얘깃거리 끝','알람 5분 전 느낌으로 평생 살 거야?'],
  done: ['오케이 인정. 오늘만','완료. 변명 금지 모드 진입','터보 엔진 잠깐 켰네','지도도 놀람 “드디어 이동함”','사람 초월까진 아니고 사람 정도'],
  unavailable: ['위치 권한부터 허락하고 훈수 두자','GPS가 못 잡아도 핑계는 잘 잡네','체감 10km? 체감은 자유, 기록은 냉정','장비 탓 금지, 본인 탓 가능','설정 안 열면 거리도 안 열림']
}

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function dayKey(d=new Date()){const t=new Date(d);t.setHours(0,0,0,0);return t.toISOString().slice(0,10)}
function haversine(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon2+lon2-lon2);const s1=Math.sin(dLat/2),s2=Math.sin(dLon/2);const a=s1*s1+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
// >>> [CHANGED] 위 haversine 기존 오타 방지
function haversineFix(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const s1=Math.sin(dLat/2),s2=Math.sin(dLon/2);const a=s1*s1+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

export default function QuestScreen(){
  const insets=useSafeAreaInsets()
  const [fontsLoaded]=useFonts({[FONT]:require('../../assets/fonts/DungGeunMo.otf')})
  const { t } = useI18n() // >>> [ADDED]
  const [perm,setPerm]=useState('undetermined')
  const [meters,setMeters]=useState(0)
  const [sessionMeters,setSessionMeters]=useState(0)

  // >>> [ADDED] 코인/퀘스트 상태
  const [coins, setCoins] = useState(0)
  const [quests, setQuests] = useState([]) // [{id,type,desc,target,done,reward,auto}]
  const [bonusGiven, setBonusGiven] = useState(false)

  const anim=useRef(new Animated.Value(0)).current
  const watchRef=useRef(null)
  const lastRef=useRef(null)
  const appActiveRef=useRef(true)

  const today = dayKey()

  // >>> [ADDED] 오늘 처음 열었음을 기록(홈 배지 제거)
  useEffect(() => {
    (async () => {
      try { await AsyncStorage.setItem('@quest/new_date', today) } catch {}
    })()
  }, [])

  async function loadCoins(){ const v = await AsyncStorage.getItem('@coins/total'); setCoins(v?Number(v):0) }
  async function saveCoins(n){ const v = Math.max(0, Number(n)||0); await AsyncStorage.setItem('@coins/total', String(v)); setCoins(v) }

  async function loadOrGenQuests(){
    const storedDate = await AsyncStorage.getItem('@quest/date')
    if (storedDate !== today) {
      await genNewQuests()
      await AsyncStorage.setItem('@quest/date', today)
      await AsyncStorage.setItem('@quest/new_date', today) // 미확인 표시 기준
      setBonusGiven(false)
    } else {
      const raw = await AsyncStorage.getItem('@quest/list')
      const bg = await AsyncStorage.getItem('@quest/bonus')
      setBonusGiven(bg === '1')
      setQuests(raw ? JSON.parse(raw) : [])
    }
  }

  async function genNewQuests(){
    // 체격/성별 반영 (간단 규칙)
    let weight=65, height=170, gender='F', targetCalories=1200
    try {
      const prof = await apiGet('/api/profile')
      if (prof?.weight) weight = Number(prof.weight)
      if (prof?.height) height = Number(prof.height)
      if (prof?.gender) gender = String(prof.gender)
      if (prof?.targetCalories) targetCalories = Number(prof.targetCalories)
    } catch {}
    const bmi = height>0 ? (weight/((height/100)*(height/100))) : 22
    const factor = Math.max(0.8, Math.min(1.4, bmi/22 * (gender==='M'?1.05:1))) // 남성 약간 상향

    // 걷기 목표(km)
    const walkKm = Math.round((4.0 * factor) * 10) / 10 // 3.2~5.6km 사이
    // 푸시업/스쿼트 목표(회)
    const pushUps = Math.round(20 * factor)
    const squats = Math.round(30 * factor)
    // 식단: 오늘 총칼로리 목표 이하로 마감
    const dietMax = Math.round(targetCalories)

    const list = [
      { id: 'walk',   type: 'walk_km',  target: walkKm, desc: `${t('WALK')} ${walkKm} km`, reward: 10, auto: true,  done: false },
      { id: 'pushup', type: 'pushup',   target: pushUps, desc: `${t('PUSHUP')} ${pushUps}`, reward: 10, auto: false, done: false },
      { id: 'squat',  type: 'squat',    target: squats,  desc: `${t('SQUAT')} ${squats}`,  reward: 10, auto: false, done: false },
      { id: 'diet',   type: 'diet_max', target: dietMax, desc: `${t('DIET')} ≤ ${dietMax} kcal`, reward: 10, auto: false, done: false },
    ]
    await AsyncStorage.setItem('@quest/list', JSON.stringify(list))
    setQuests(list)
  }

  async function markDone(id){
    const list = quests.map(q => q.id===id ? { ...q, done: true } : q)
    setQuests(list)
    await AsyncStorage.setItem('@quest/list', JSON.stringify(list))
    // 보상 지급 n*10 (n=1 고정, 요구 예시 반영)
    const q = list.find(x=>x.id===id)
    if (q && q.reward) await saveCoins(coins + q.reward)
    // 모두 완료 추가 보너스 +20
    const allDone = list.every(x=>x.done)
    if (allDone && !bonusGiven) {
      await saveCoins(coins + (q?.reward||0) + 20) // 마지막 퀘 완료 순간 +20
      setBonusGiven(true)
      await AsyncStorage.setItem('@quest/bonus', '1')
    }
  }

  // 0시 리셋은 날짜키 비교로 처리(loadOrGenQuests에서)
  useEffect(()=>{ (async()=>{ await loadCoins(); await loadOrGenQuests(); })() }, [])

  useEffect(()=>{const sub=AppState.addEventListener('change',s=>{appActiveRef.current=(s==='active')});return()=>sub?.remove?.()},[])
  useEffect(()=>{let mounted=true;(async()=>{
    const {status}=await Location.requestForegroundPermissionsAsync().catch(()=>({status:'denied'}))
    if (!mounted) return
    setPerm(status||'denied')
    if ((status||'denied')!=='granted') return
    lastRef.current=null
    watchRef.current?.remove?.()
    watchRef.current=await Location.watchPositionAsync(
      {accuracy:Location.Accuracy.BestForNavigation,timeInterval:2000,distanceInterval:10,mayShowUserSettingsDialog:true},
      async pos=>{
        if(!appActiveRef.current) return
        const {coords,timestamp}=pos||{}
        const {latitude,longitude,accuracy,speed}=coords||{}
        if(!(latitude&&longitude))return
        if(typeof accuracy==='number'&&accuracy>25)return
        const last=lastRef.current
        lastRef.current={lat:latitude,lon:longitude,t:timestamp||Date.now()}
        if(!last)return
        const now=timestamp||Date.now()
        const dt=Math.max(1,(now-(last.t||now))/1000)
        const d=haversineFix(last.lat,last.lon,latitude,longitude)
        const v=d/dt
        if(d<10||d>100)return
        const vOk=v>=0.7&&v<=4.5
        const sOk=typeof speed==='number'?speed>=0.7&&speed<=4.5:true
        if(!(vOk&&sOk))return
        setSessionMeters(vv=>vv+d)
        setMeters(prev=>prev+d)
      }
    )
  })();return()=>{mounted=false;watchRef.current?.remove?.()}},[])

  // 걷기 자동완료 체크
  useEffect(()=>{
    const q = quests.find(x=>x.id==='walk')
    if (!q) return
    const km = (meters/1000)
    const done = km >= q.target - 1e-6
    if (done && !q.done) markDone('walk')
  }, [meters, quests])

  // 진행바/도발문구(걷기 기존 유지)
  const [quip,setQuip]=useState('')
  useEffect(()=>{
    const q = quests.find(x=>x.id==='walk')
    const goalMeters = q ? q.target*1000 : 0
    const ratio=goalMeters>0?Math.min(meters/goalMeters,1):0
    Animated.timing(anim,{toValue:ratio,duration:400,useNativeDriver:false}).start()
    const d=goalMeters>0 && meters>=goalMeters
    const r=goalMeters>0?meters/goalMeters:0
    if(perm!=='granted')setQuip(pick(TAUNTS.unavailable))
    else if(d)setQuip(pick(TAUNTS.done))
    else if(meters===0)setQuip(pick(TAUNTS.none))
    else if(r<0.3)setQuip(pick(TAUNTS.low))
    else if(r<0.8)setQuip(pick(TAUNTS.mid))
    else setQuip(pick(TAUNTS.near))
  },[meters, quests, perm])

  if(!fontsLoaded){
    return(
      <View style={[styles.center,{backgroundColor:'#000'}]}>
        <ActivityIndicator />
      </View>
    )
  }

  const width=anim.interpolate({inputRange:[0,1],outputRange:['0%','100%']})
  const walkQ = quests.find(x=>x.id==='walk')
  const km = ((meters)/1000).toFixed(2)
  const goalKm = walkQ ? walkQ.target.toFixed(1) : '0.0'

  // 수동 완료 버튼
  const QuestRow = ({ item }) => (
    <View style={styles.rowQ}>
      <Text style={styles.rowText}>{item.desc}</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Text style={styles.reward}>{t('REWARD')} +{item.reward}</Text>
        <TouchableOpacity
          disabled={item.done || item.auto}
          onPress={() => markDone(item.id)}
          style={[styles.btn, item.done ? { backgroundColor: '#10b981' } : (item.auto ? { backgroundColor: '#9ca3af' } : null)]}
        >
          <Text style={styles.btnText}>{item.done ? 'DONE' : (item.auto ? 'AUTO' : t('CONFIRM'))}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return(
    <ImageBackground source={require('../../assets/background/home.png')} style={{flex:1}} resizeMode="cover">
      <Text style={[styles.screenTitle,{top:insets.top+8}]}>{t('QUEST')}</Text>
      <View style={{paddingTop:insets.top+88,paddingHorizontal:18,gap:16}}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('DAILY_QUESTS')}</Text>
          {/* 걷기 게이지 */}
          <Text style={styles.questMain}>{t('WALK')} {goalKm} km</Text>
          <View style={styles.barWrap}>
            <Animated.View style={[styles.barFill,{width}]}/>
            <Text style={styles.barText}>{km} / {goalKm} km</Text>
          </View>
          <Text style={styles.quip}>{quip}</Text>
          <Text style={styles.hint}>{perm==='granted'?'위치 사용 가능':'권한 필요: 위치'}</Text>
          {Platform.OS==='android'&&<Text style={styles.hint}>정확도 높음, 배터리 최적화 제외 권장</Text>}
          {perm!=='granted'&&<Text onPress={()=>Linking.openSettings()} style={[styles.hint,{textDecorationLine:'underline'}]}>설정 열기</Text>}
        </View>

        {/* 나머지 3개 */}
        <View style={styles.subCard}>
          {quests.filter(x=>x.id!=='walk').map(q => <QuestRow key={q.id} item={q} />)}
          <View style={{ height: 8 }} />
          <Text style={{ fontFamily: FONT, textAlign: 'right' }}>{t('ALL_CLEARED_BONUS')} +20</Text>
          <Text style={{ fontFamily: FONT, textAlign: 'right' }}>{t('REWARD')}: {coins}</Text>
        </View>
      </View>
    </ImageBackground>
  )
}

const styles=StyleSheet.create({
  screenTitle:{position:'absolute',left:0,right:0,textAlign:'center',color:'#000',fontSize:26,textShadowColor:'rgba(255,255,255,0.28)',textShadowOffset:{width:0,height:1},textShadowRadius:2,zIndex:10,fontFamily:FONT,fontWeight:'normal'},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  card:{backgroundColor:'rgba(255,255,255,0.8)',borderRadius:24,padding:18,gap:12,shadowColor:'#000',shadowOpacity:0.12,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:3},
  title:{fontFamily:FONT,fontSize:20,color:'#111',fontWeight:'normal'},
  questMain:{fontFamily:FONT,fontSize:28,color:'#111',fontWeight:'normal'},
  barWrap:{height:26,borderWidth:2,borderColor:'#111',borderRadius:10,overflow:'hidden',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.05)'},
  barFill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'rgba(34,197,94,0.85)'},
  barText:{textAlign:'center',fontFamily:FONT,fontSize:14,color:'#111',fontWeight:'normal'},
  quip:{fontFamily:FONT,fontSize:14,color:'#000',marginTop:2,fontWeight:'normal'},
  hint:{fontFamily:FONT,fontSize:12,color:'#666',textAlign:'center',marginTop:6,fontWeight:'normal'},
  subCard:{backgroundColor:'rgba(255,255,255,0.72)',borderRadius:20,padding:16,gap:8,shadowColor:'#000',shadowOpacity:0.1,shadowRadius:8,shadowOffset:{width:0,height:3}},
  rowQ:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderColor:'rgba(0,0,0,0.06)'},
  rowText:{fontFamily:FONT,fontSize:16,color:'#111'},
  reward:{fontFamily:FONT,fontSize:14,color:'#ef4444'},
  btn:{paddingHorizontal:12,paddingVertical:6,backgroundColor:'#111827',borderRadius:8},
  btnText:{fontFamily:FONT,color:'#fff',fontSize:12},
})

// src/screens/QuestScreen.jsx
import { useEffect, useRef, useState, useMemo } from 'react'
import { View, Text, ImageBackground, StyleSheet, Animated, Platform, AppState, Linking, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts } from 'expo-font'
import { useI18n } from '../i18n/I18nContext'
import { apiGet } from '../config/api'

const FONT = 'DungGeunMo'

// 👇 원래 쓰던 다국어 맵 그대로 유지
const TAUNTS_MAP = {
  none: {
    ko: ['0.00km… 산책 앱을 켰는데 산책은 안 함','첫 좌표에서 평생 살 계획?','오늘도 바닥이랑 베프네','다리는 절전 모드, 폰만 고성능','앉아있는 재능 국가대표'],
    en: ['0.00km… Opened the app but no walk','Planning to live at the first GPS point forever?','Best friends with the floor again','Legs in power save, phone on turbo','National-team level at sitting'],
    ja: ['0.00km… アプリ開いたのに歩いてない','最初の座標で一生暮らすの？','今日も床と親友','足は省電力、スマホはハイスペ','座りっぱなしの才能は代表クラス'],
    zh: ['0.00km… 打开了应用却没走','打算一辈子待在第一个坐标？','今天又和地板做朋友','腿在省电模式，手机在高性能','坐着的天赋国家级'],
  },
  done: {
    ko: ['오케이 인정. 오늘만','완료. 변명 금지 모드 진입','터보 엔진 잠깐 켰네'],
    en: ['Okay, respect. Today only','Done. Excuse-free mode engaged','Turbo engine briefly on'],
    ja: ['オーケー認めよう。今日はね','完了。言い訳禁止モード突入','ターボ一瞬ON'],
    zh: ['行，认可。仅限今天','完成。进入无借口模式','涡轮短暂开启'],
  },
  unavailable: {
    ko: ['위치 권한부터 허락하고 훈수 두자','GPS가 못 잡아도 핑계는 잘 잡네'],
    en: ['Grant location first, then coach me','GPS can’t lock but excuses can'],
    ja: ['まず位置情報を許可してから指示して','GPSは掴めないのに言い訳は掴む'],
    zh: ['先给定位权限，再来指点','GPS锁不住，借口倒挺多'],
  },
}

const TAUNTS = (lang) => ({
  none: TAUNTS_MAP.none[lang] || TAUNTS_MAP.none.ko,
  done: TAUNTS_MAP.done[lang] || TAUNTS_MAP.done.ko,
  unavailable: TAUNTS_MAP.unavailable[lang] || TAUNTS_MAP.unavailable.ko,
})

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function dayKey(d=new Date()){const t=new Date(d);t.setHours(0,0,0,0);return t.toISOString().slice(0,10)}
function haversineFix(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const s1=Math.sin(dLat/2),s2=Math.sin(dLon/2);const a=s1*s1+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

export default function QuestScreen(){
  const navigation = useNavigation()
  const insets=useSafeAreaInsets()
  const [fontsLoaded]=useFonts({[FONT]:require('../../assets/fonts/DungGeunMo.otf')})
  const { t, lang } = useI18n()
  const [perm,setPerm]=useState('undetermined')
  const [meters,setMeters]=useState(0)
  const [sessionMeters,setSessionMeters]=useState(0)
  const [quests, setQuests] = useState([])
  const anim=useRef(new Animated.Value(0)).current
  const watchRef=useRef(null)
  const lastRef=useRef(null)
  const appActiveRef=useRef(true)
  const today = dayKey()
  const taunts = useMemo(()=>TAUNTS(lang), [lang])

  async function loadOrGenQuests(){
    const storedDate = await AsyncStorage.getItem('@quest/date')
    if (storedDate !== today) {
      await genNewQuests()
      await AsyncStorage.setItem('@quest/date', today)
    } else {
      const raw = await AsyncStorage.getItem('@quest/list')
      setQuests(raw ? JSON.parse(raw) : [])
    }
  }

  async function genNewQuests(){
    let weight=65, height=170, gender='F'
    try {
      const prof = await apiGet('/api/profile')
      if (prof?.weight) weight = Number(prof.weight)
      if (prof?.height) height = Number(prof.height)
      if (prof?.gender) gender = String(prof.gender)
    } catch {}
    const bmi = height>0 ? (weight/((height/100)*(height/100))) : 22
    const factor = Math.max(0.8, Math.min(1.4, bmi/22 * (gender==='M'?1.05:1)))
    const walkKm = Math.round((4.0 * factor) * 10) / 10
    const squats = Math.round(30 * factor)
    const situps = Math.round(25 * factor)

    const list = [
      { id: 'walk',  type: 'walk_km', target: walkKm, desc: `${t('WALK')} ${walkKm} km`, auto: true,  done: false },
      { id: 'squat', type: 'squat',   target: squats,  desc: `${t('SQUAT')} ${squats}`,   auto: false, done: false },
      { id: 'situp', type: 'situp',   target: situps,  desc: `${t('SITUP') || 'SIT-UP'} ${situps}`, auto: false, done: false },
    ]
    await AsyncStorage.setItem('@quest/list', JSON.stringify(list))
    setQuests(list)
  }

  async function markDone(id){
    const list = quests.map(q => q.id===id ? { ...q, done: true } : q)
    setQuests(list)
    await AsyncStorage.setItem('@quest/list', JSON.stringify(list))
  }

  useEffect(()=>{ (async()=>{ await loadOrGenQuests(); })() }, [])

  useFocusEffect(
    useMemo(() => () => {
      (async () => {
        const sFlag = await AsyncStorage.getItem('@quest/squat_done')
        if (sFlag === '1') {
          await AsyncStorage.removeItem('@quest/squat_done')
          const q = quests.find(x => x.id === 'squat')
          if (q && !q.done) await markDone('squat')
        }
        const uFlag = await AsyncStorage.getItem('@quest/situp_done')
        if (uFlag === '1') {
          await AsyncStorage.removeItem('@quest/situp_done')
          const q = quests.find(x => x.id === 'situp')
          if (q && !q.done) await markDone('situp')
        }
      })()
    }, [quests])
  )

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

  const [quip,setQuip]=useState('')
  useEffect(()=>{
    const q = quests.find(x=>x.id==='walk')
    const goalMeters = q ? q.target*1000 : 0
    const ratio=goalMeters>0?Math.min(meters/goalMeters,1):0
    Animated.timing(anim,{toValue:ratio,duration:400,useNativeDriver:false}).start()
    if(perm!=='granted') setQuip(pick(taunts.unavailable))
    else if(goalMeters>0 && meters>=goalMeters) setQuip(pick(taunts.done))
    else if(meters===0) setQuip(pick(taunts.none))
  },[meters, quests, perm, taunts, anim])

  if(!fontsLoaded){
    return(
      <View style={[styles.center,{backgroundColor:'#000'}]}>
        <ActivityIndicator />
      </View>
    )
  }

  const width=anim.interpolate({inputRange:[0,1],outputRange:['0%','100%']})
  const walkQ = quests.find(x=>x.id==='walk')
  const squatQ = quests.find(x=>x.id==='squat')
  const situpQ = quests.find(x=>x.id==='situp')
  const km = ((meters)/1000).toFixed(2)
  const goalKm = walkQ ? walkQ.target.toFixed(1) : '0.0'

  const startSquat = () => navigation.navigate('SquatCounterSimple', { target: squatQ.target })
  const startSitup = () => navigation.navigate('SitupCounterHand', { target: situpQ.target })

  const QuestRow = ({ item }) => {
    const onPress = item.id === 'squat' ? startSquat : startSitup
    return (
      <View style={styles.rowQ}>
        <Text style={styles.rowText}>{item.desc}</Text>
        <TouchableOpacity onPress={onPress} style={[styles.btn, item.done ? { backgroundColor: '#10b981' } : null]}>
          <Text style={styles.btnText}>{item.done ? t('DONE') : t('START')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return(
    <ImageBackground source={require('../../assets/background/home.png')} style={{flex:1}} resizeMode="cover">
      <Text style={[styles.screenTitle,{top:insets.top+8}]}>{t('QUEST')}</Text>
      <View style={{paddingTop:insets.top+88,paddingHorizontal:18,gap:16}}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('DAILY_QUESTS')}</Text>
          <Text style={styles.questMain}>{t('WALK')} {goalKm} km</Text>
          <View style={styles.barWrap}>
            <Animated.View style={[styles.barFill,{width}]}/>
            <Text style={styles.barText}>{km} / {goalKm} km</Text>
          </View>
          <Text style={styles.quip}>{quip}</Text>
        </View>

        <View style={styles.subCard}>
          {quests.filter(x => x.id === 'squat' || x.id === 'situp').map(q => <QuestRow key={q.id} item={q} />)}
        </View>

        {/* 🔹 RESET 버튼 */}
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.removeItem('@quest/list')
            await AsyncStorage.removeItem('@quest/date')
            await loadOrGenQuests()
          }}
          style={[styles.btn, { marginTop: 20, alignSelf: 'center', backgroundColor: '#ef4444' }]}
        >
          <Text style={styles.btnText}>RESET QUESTS</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

const styles=StyleSheet.create({
  screenTitle:{position:'absolute',left:0,right:0,textAlign:'center',color:'#000',fontSize:26,textShadowColor:'rgba(255,255,255,0.28)',textShadowOffset:{width:0,height:1},textShadowRadius:2,zIndex:10,fontFamily:FONT,fontWeight:'normal'},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  card:{backgroundColor:'rgba(255,255,255,0.8)',borderRadius:24,padding:18,gap:12},
  title:{fontFamily:FONT,fontSize:20,color:'#111'},
  questMain:{fontFamily:FONT,fontSize:28,color:'#111'},
  barWrap:{height:26,borderWidth:2,borderColor:'#111',borderRadius:10,overflow:'hidden',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.05)'},
  barFill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'rgba(34,197,94,0.85)'},
  barText:{textAlign:'center',fontFamily:FONT,fontSize:14,color:'#111'},
  quip:{fontFamily:FONT,fontSize:14,color:'#000',marginTop:2},
  subCard:{backgroundColor:'rgba(255,255,255,0.72)',borderRadius:20,padding:16,gap:8},
  rowQ:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderColor:'rgba(0,0,0,0.06)'},
  rowText:{fontFamily:FONT,fontSize:16,color:'#111'},
  btn:{paddingHorizontal:12,paddingVertical:6,backgroundColor:'#111827',borderRadius:8},
  btnText:{fontFamily:FONT,color:'#fff',fontSize:12},
})

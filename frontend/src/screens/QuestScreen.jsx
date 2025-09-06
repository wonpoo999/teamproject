// src/screens/QuestScreen.jsx
import { useEffect, useRef, useState, useMemo } from 'react'
import { View, Text, ImageBackground, StyleSheet, Animated, Platform, AppState, Linking, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts } from 'expo-font'
import { useI18n } from '../i18n/I18nContext'
import { apiGet } from '../config/api'

const FONT = 'DungGeunMo'

// ===== 다국어 도발 멘트 =====
const TAUNTS_MAP = {
  none: {
    ko: ['0.00km… 산책 앱을 켰는데 산책은 안 함','첫 좌표에서 평생 살 계획?','오늘도 바닥이랑 베프네','다리는 절전 모드, 폰만 고성능','앉아있는 재능 국가대표'],
    en: ['0.00km… Opened the app but no walk','Planning to live at the first GPS point forever?','Best friends with the floor again','Legs in power save, phone on turbo','National-team level at sitting'],
    ja: ['0.00km… アプリ開いたのに歩いてない','最初の座標で一生暮らすの？','今日も床と親友','足は省電力、スマホはハイスペ','座りっぱなしの才能は代表クラス'],
    zh: ['0.00km… 打开了应用却没走','打算一辈子待在第一个坐标？','今天又和地板做朋友','腿在省电模式，手机在高性能','坐着的天赋国家级'],
  },
  low: {
    ko: ['워밍업 끝? 이제 진짜 이동은 언제?','편의점 왕복이 오늘의 하이라이트?','GPS가 울어요 “움직여줘…”','지구 둘레 4万km 중 0.1도 못 채웠다','발 대신 손가락만 운동하는 중'],
    en: ['Warm-up done? When does the real move start?','Convenience store round trip is the highlight?','GPS is crying: “Please move…”','40,000km around Earth, you did 0.1','Only fingers are exercising'],
    ja: ['準備運動は終わり？本番はいつ？','コンビニ往復が今日のハイライト？','GPSが泣いてる「動いて…」','地球一周4万kmのうち0.1だけ','指だけ筋トレ中'],
    zh: ['热身结束？正式出发什么时候？','今天的亮点是便利店往返？','GPS在哭：“动一动…”','地球四万公里，你完成了0.1','只有手指在运动'],
  },
  mid: {
    ko: ['반도 안 왔는데 숨 먼저 참네','이 속도면 달팽이도 추월하겠다','물 마셨지? 이제 걸어라 인간','지도를 확대하면 길어 보이긴 함','오늘도 “산책의 추억(구라)” 제작 중'],
    en: ['Not even halfway and already holding your breath','At this pace, snails will pass you','Hydrated? Now walk, human','Zooming the map doesn’t make it longer','Making “Walking Memories (fiction)” again'],
    ja: ['半分も来てないのにもう息切れ？','この速度ならカタツムリに抜かれる','水分取った？さあ歩け人間','地図を拡大しても距離は増えない','今日も「散歩の思い出（フィクション）」制作中'],
    zh: ['还不到一半就开始喘了？','这个速度会被蜗牛超车','补水完毕？现在开始走吧','地图放大不等于路变长','今天也在制作“散步回忆（虚构）”'],
  },
  near: {
    ko: ['코앞에서 멈추면 구경꾼 인증','결승선 보이는데 왜 브레이크?','끝까지 가면 칭찬… 받을 수도 말 수도','여기서 멈추면 오늘 얘깃거리 끝','알람 5분 전 모드로 평생 갈 거야?'],
    en: ['Stop at the finish line’s nose—spectator confirmed','See the tape—why hit the brakes?','Go to the end and maybe… get praise','Stop here and the story ends','Living life in “5 minutes before alarm” mode?'],
    ja: ['ゴール直前で止まったら観客認定','テープ見えてるのにブレーキ？','最後まで行けば…褒めるかも','ここで止まったら今日の話題は終了','一生「アラーム5分前」モードで行く？'],
    zh: ['就在终点前停下=观众认证','都看到终点线了为何刹车？','坚持到最后…也许会被表扬','现在停下，今天就没话题了','一辈子“闹钟前5分钟”模式？'],
  },
  done: {
    ko: ['오케이 인정. 오늘만','완료. 변명 금지 모드 진입','터보 엔진 잠깐 켰네','지도도 놀람 “드디어 이동함”','사람 초월까진 아니고 사람 정도'],
    en: ['Okay, respect. Today only','Done. Excuse-free mode engaged','Turbo engine briefly on','Map shocked: “Finally moving”','Not superhuman, but human at least'],
    ja: ['オーケー認めよう。今日はね','完了。言い訳禁止モード突入','ターボ一瞬ON','地図も驚き「ついに動いた」','超人ではないが人間レベルには到達'],
    zh: ['行，认可。仅限今天','完成。进入无借口模式','涡轮短暂开启','地图也震惊“终于动了”','超人算不上，人类还行'],
  },
  unavailable: {
    ko: ['위치 권한부터 허락하고 훈수 두자','GPS가 못 잡아도 핑계는 잘 잡네','체감 10km? 기록은 냉정해','장비 탓 금지, 본인 탓 가능','설정 안 열면 거리도 안 열림'],
    en: ['Grant location first, then coach me','GPS can’t lock but excuses can','Feels like 10km? Records are cold','No blaming gear—blame yourself','No settings, no distance'],
    ja: ['まず位置情報を許可してから指示して','GPSは掴めないのに言い訳は掴む','体感10km？記録は冷酷','機材のせい禁止、自分のせいは可','設定を開かなければ距離も開かない'],
    zh: ['先给定位权限，再来指点','GPS锁不住，借口倒挺多','体感10公里？记录很冷静','别怪设备，可以怪自己','不打开设置，就走不出距离'],
  },
}

// 언어별 배열을 반환
const TAUNTS = (lang) => ({
  none: TAUNTS_MAP.none[lang] || TAUNTS_MAP.none.ko,
  low: TAUNTS_MAP.low[lang] || TAUNTS_MAP.low.ko,
  mid: TAUNTS_MAP.mid[lang] || TAUNTS_MAP.mid.ko,
  near: TAUNTS_MAP.near[lang] || TAUNTS_MAP.near.ko,
  done: TAUNTS_MAP.done[lang] || TAUNTS_MAP.done.ko,
  unavailable: TAUNTS_MAP.unavailable[lang] || TAUNTS_MAP.unavailable.ko,
})

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function dayKey(d=new Date()){const t=new Date(d);t.setHours(0,0,0,0);return t.toISOString().slice(0,10)}
function haversine(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon2+lon2-lon2);const s1=Math.sin(dLat/2),s2=Math.sin(dLon/2);const a=s1*s1+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
// 오타 방지 버전
function haversineFix(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const s1=Math.sin(dLat/2),s2=Math.sin(dLon/2);const a=s1*s1+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

export default function QuestScreen(){
  const insets=useSafeAreaInsets()
  const [fontsLoaded]=useFonts({[FONT]:require('../../assets/fonts/DungGeunMo.otf')})
  const { t, lang } = useI18n()
  const [perm,setPerm]=useState('undetermined')
  const [meters,setMeters]=useState(0)
  const [sessionMeters,setSessionMeters]=useState(0)

  const [coins, setCoins] = useState(0)
  const [quests, setQuests] = useState([]) // [{id,type,desc,target,done,reward,auto}]
  const [bonusGiven, setBonusGiven] = useState(false)

  const anim=useRef(new Animated.Value(0)).current
  const watchRef=useRef(null)
  const lastRef=useRef(null)
  const appActiveRef=useRef(true)

  const today = dayKey()
  const taunts = useMemo(()=>TAUNTS(lang), [lang])  // <<< 언어별 도발 세트

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
      await AsyncStorage.setItem('@quest/new_date', today)
      setBonusGiven(false)
    } else {
      const raw = await AsyncStorage.getItem('@quest/list')
      const bg = await AsyncStorage.getItem('@quest/bonus')
      setBonusGiven(bg === '1')
      setQuests(raw ? JSON.parse(raw) : [])
    }
  }

  async function genNewQuests(){
    let weight=65, height=170, gender='F', targetCalories=1200
    try {
      const prof = await apiGet('/api/profile')
      if (prof?.weight) weight = Number(prof.weight)
      if (prof?.height) height = Number(prof.height)
      if (prof?.gender) gender = String(prof.gender)
      if (prof?.targetCalories) targetCalories = Number(prof.targetCalories)
    } catch {}
    const bmi = height>0 ? (weight/((height/100)*(height/100))) : 22
    const factor = Math.max(0.8, Math.min(1.4, bmi/22 * (gender==='M'?1.05:1)))

    const walkKm = Math.round((4.0 * factor) * 10) / 10
    const pushUps = Math.round(20 * factor)
    const squats = Math.round(30 * factor)
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
    const q = list.find(x=>x.id===id)
    if (q && q.reward) await saveCoins(coins + q.reward)
    const allDone = list.every(x=>x.done)
    if (allDone && !bonusGiven) {
      await saveCoins(coins + (q?.reward||0) + 20)
      setBonusGiven(true)
      await AsyncStorage.setItem('@quest/bonus', '1')
    }
  }

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

  useEffect(()=>{
    const q = quests.find(x=>x.id==='walk')
    if (!q) return
    const km = (meters/1000)
    const done = km >= q.target - 1e-6
    if (done && !q.done) markDone('walk')
  }, [meters, quests])

  const [quip,setQuip]=useState('')
  useEffect(()=>{
    const q = quests.find(x=>x.id==='walk')
    const goalMeters = q ? q.target*1000 : 0
    const ratio=goalMeters>0?Math.min(meters/goalMeters,1):0
    Animated.timing(anim,{toValue:ratio,duration:400,useNativeDriver:false}).start()
    const achieved=goalMeters>0 && meters>=goalMeters
    const r=goalMeters>0?meters/goalMeters:0
    if(perm!=='granted') setQuip(pick(taunts.unavailable))
    else if(achieved)    setQuip(pick(taunts.done))
    else if(meters===0)  setQuip(pick(taunts.none))
    else if(r<0.3)       setQuip(pick(taunts.low))
    else if(r<0.8)       setQuip(pick(taunts.mid))
    else                 setQuip(pick(taunts.near))
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
  const km = ((meters)/1000).toFixed(2)
  const goalKm = walkQ ? walkQ.target.toFixed(1) : '0.0'

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
          <Text style={styles.btnText}>
            {item.done ? t('DONE') : (item.auto ? t('AUTO') : t('CONFIRM'))}
          </Text>
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
          <Text style={styles.questMain}>{t('WALK')} {goalKm} km</Text>
          <View style={styles.barWrap}>
            <Animated.View style={[styles.barFill,{width}]}/>
            <Text style={styles.barText}>{km} / {goalKm} km</Text>
          </View>
          <Text style={styles.quip}>{quip}</Text>

          <Text style={styles.hint}>{perm==='granted' ? t('LOCATION_OK') : t('LOCATION_NEEDED')}</Text>
          {Platform.OS==='android' && <Text style={styles.hint}>{t('ANDROID_LOCATION_HINT') || t('ANDROID_LOCATION_HINT') /* 키 이름 통일 시 이 줄만 남김 */}</Text>}
          {perm!=='granted' && (
            <Text onPress={()=>Linking.openSettings()} style={[styles.hint,{textDecorationLine:'underline'}]}>
              {t('OPEN_SETTINGS')}
            </Text>
          )}
        </View>

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

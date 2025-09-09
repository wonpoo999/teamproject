// src/screens/QuestScreen.js
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, ImageBackground, StyleSheet, Animated, AppState,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { useI18n } from '../i18n/I18nContext';
import { apiGet } from '../config/api';
import { useThemeMode } from '../theme/ThemeContext';

const FONT = 'DungGeunMo';
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.includeFontPadding = true;

const AWARD_PER_QUEST = 1;

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
};

const TAUNTS = (lang) => ({
  none: TAUNTS_MAP.none[lang] || TAUNTS_MAP.none.ko,
  done: TAUNTS_MAP.done[lang] || TAUNTS_MAP.done.ko,
  unavailable: TAUNTS_MAP.unavailable[lang] || TAUNTS_MAP.unavailable.ko,
});

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function dayKey(d=new Date()){const t=new Date(d);t.setHours(0,0,0,0);return t.toISOString().slice(0,10)}
function haversineFix(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const s1=Math.sin(dLat/2),s2=Math.sin(dLon/2);const a=s1*s1+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

export default function QuestScreen(){
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeMode();
  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') });
  const { t, lang } = useI18n();

  const [perm,setPerm]=useState('undetermined');
  const [meters,setMeters]=useState(0);
  const [sessionMeters,setSessionMeters]=useState(0);
  const [quests, setQuests] = useState([]);

  const [coins, setCoins] = useState(0);
  const [awardedWalk, setAwardedWalk] = useState(false);

  const anim=useRef(new Animated.Value(0)).current;
  const watchRef=useRef(null);
  const lastRef=useRef(null);
  const appActiveRef=useRef(true);
  const today = dayKey();
  const taunts = useMemo(()=>TAUNTS(lang), [lang]);

  async function loadCoins() {
    const raw = await AsyncStorage.getItem('@coins');
    const n = Number(raw ?? 0);
    setCoins(Number.isFinite(n) ? n : 0);
    const tag = await AsyncStorage.getItem('@quest/awarded_walk');
    setAwardedWalk(tag === today);
  }
  async function addCoins(n) {
    const next = Math.max(0, (coins || 0) + n);
    setCoins(next);
    await AsyncStorage.setItem('@coins', String(next));
  }

  async function loadOrGenQuests(){
    const storedDate = await AsyncStorage.getItem('@quest/date');
    if (storedDate !== today) {
      await genNewQuests();
      await AsyncStorage.setItem('@quest/date', today);
      await AsyncStorage.removeItem('@quest/awarded_walk');
      setAwardedWalk(false);
    } else {
      const raw = await AsyncStorage.getItem('@quest/list');
      setQuests(raw ? JSON.parse(raw) : []);
    }
  }

  async function genNewQuests(){
    let weight=65, height=170, gender='F';
    try {
      const prof = await apiGet('/api/profile');
      if (prof?.weight) weight = Number(prof.weight);
      if (prof?.height) height = Number(prof.height);
      if (prof?.gender) gender = String(prof.gender);
    } catch {}
    const bmi = height>0 ? (weight/((height/100)*(height/100))) : 22;
    const factor = Math.max(0.8, Math.min(1.4, bmi/22 * (gender==='M'?1.05:1)));
    const walkKm = Math.round((4.0 * factor) * 10) / 10;
    const squats = Math.round(30 * factor);
    const pushups = Math.round(20 * factor);

    const list = [
      { id: 'walk',  type: 'walk_km', target: walkKm, desc: `${t('WALK')} ${walkKm} km`,  auto: true,  done: false, rewarded:false },
      { id: 'squat', type: 'squat',   target: squats,  desc: `${t('SQUAT')} ${squats}`,    auto: false, done: false, rewarded:false },
      { id: 'pushup',type: 'pushup',  target: pushups, desc: `${t('PUSHUP')} ${pushups}`,  auto: false, done: false, rewarded:false },
    ];
    await AsyncStorage.setItem('@quest/list', JSON.stringify(list));
    setQuests(list);
  }

  useEffect(()=>{ (async()=>{ await loadOrGenQuests(); await loadCoins(); })() }, []);

  useFocusEffect(useMemo(() => () => { return () => {} }, []));

  useEffect(()=>{const sub=AppState.addEventListener('change',s=>{appActiveRef.current=(s==='active')});return()=>sub?.remove?.()},[]);
  useEffect(()=>{let mounted=true;(async()=>{
    const {status}=await Location.requestForegroundPermissionsAsync().catch(()=>({status:'denied'}));
    if (!mounted) return;
    setPerm(status||'denied');
    if ((status||'denied')!=='granted') return;
    lastRef.current=null;
    watchRef.current?.remove?.();
    watchRef.current=await Location.watchPositionAsync(
      {accuracy:Location.Accuracy.BestForNavigation,timeInterval:2000,distanceInterval:10,mayShowUserSettingsDialog:true},
      async pos=>{
        if(!appActiveRef.current) return;
        const {coords,timestamp}=pos||{};
        const {latitude,longitude,accuracy,speed}=coords||{};
        if(!(latitude&&longitude))return;
        if(typeof accuracy==='number'&&accuracy>25)return;
        const last=lastRef.current;
        lastRef.current={lat:latitude,lon:longitude,t:timestamp||Date.now()};
        if(!last)return;
        const now=timestamp||Date.now();
        const dt=Math.max(1,(now-(last.t||now))/1000);
        const d=haversineFix(last.lat,last.lon,latitude,longitude);
        const v=d/dt;
        if(d<10||d>100)return;
        const vOk=v>=0.7&&v<=4.5;
        const sOk=typeof speed==='number'?speed>=0.7&&speed<=4.5:true;
        if(!(vOk&&sOk))return;
        setSessionMeters(vv=>vv+d);
        setMeters(prev=>prev+d);
      }
    )
  })();return()=>{mounted=false;watchRef.current?.remove?.()}},[]);

  const [quip,setQuip]=useState('');
  useEffect(()=>{
    const q = quests.find(x=>x.id==='walk');
    const goalMeters = q ? q.target*1000 : 0;
    const ratio=goalMeters>0?Math.min(meters/goalMeters,1):0;
    Animated.timing(anim,{toValue:ratio,duration:400,useNativeDriver:false}).start();

    if(perm!=='granted') setQuip(pick(taunts.unavailable));
    else if(goalMeters>0 && meters>=goalMeters) {
      setQuip(pick(taunts.done));
      (async () => {
        if (!awardedWalk) {
          await addCoins(AWARD_PER_QUEST);
          await AsyncStorage.setItem('@quest/awarded_walk', today);
          setAwardedWalk(true);
          const list = [...quests];
          const i = list.findIndex(x => x.id==='walk');
          if (i>=0) {
            list[i] = { ...list[i], done: true, rewarded: true };
            setQuests(list);
            await AsyncStorage.setItem('@quest/list', JSON.stringify(list));
          }
        }
      })();
    } else if(meters===0) {
      setQuip(pick(taunts.none));
    }
  },[meters, quests, perm, taunts, anim, awardedWalk, today]);

  async function markManualDone(id){
    const list = [...quests];
    const i = list.findIndex(q => q.id===id);
    if (i<0) return;
    if (!list[i].rewarded) {
      await addCoins(AWARD_PER_QUEST);
      list[i] = { ...list[i], done: true, rewarded: true };
      setQuests(list);
      await AsyncStorage.setItem('@quest/list', JSON.stringify(list));
    }
  }

  if(!fontsLoaded){
    return(
      <View style={[styles.center,{backgroundColor:'#000'}]}>
        <ActivityIndicator />
      </View>
    );
  }

  const width=anim.interpolate({inputRange:[0,1],outputRange:['0%','100%']});
  const walkQ = quests.find(x=>x.id==='walk');
  const squatQ = quests.find(x=>x.id==='squat');
  const pushupQ = quests.find(x=>x.id==='pushup');
  const km = ((meters)/1000).toFixed(2);
  const goalKm = walkQ ? walkQ.target.toFixed(1) : '0.0';

  const startSquat = () => squatQ && navigation.navigate('TACoach', {
    mode: 'squat',
    target: squatQ.target,
    onComplete: () => markManualDone('squat'),
  });
  const startPushup = () => pushupQ && navigation.navigate('TACoach', {
    mode: 'pushup',
    target: pushupQ.target,
    onComplete: () => markManualDone('pushup'),
  });

  const canSquat = !!squatQ;
  const canPush = !!pushupQ;

  const bg = isDark
    ? require('../../assets/background/home_dark.png')
    : require('../../assets/background/home.png');

  return(
    <ImageBackground source={bg} style={{flex:1}} resizeMode="cover">
      <Text style={[styles.screenTitle,{top:insets.top+8}]}>{t('DAILY_QUESTS')}</Text>

      <View style={[styles.coinPill, { top: insets.top + 10 }]}>
        <Text style={styles.coinEmoji}>🪙</Text>
        <Text style={styles.coinTxt}>{String(coins)}</Text>
      </View>

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

        <View style={styles.quickRow}>
          <TouchableOpacity onPress={startSquat} disabled={!canSquat} style={[styles.quickBtn, !canSquat && styles.disabled]}>
            <Text style={styles.quickTxt}>{t('START_SQUAT')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startPushup} disabled={!canPush} style={[styles.quickBtn, !canPush && styles.disabled]}>
            <Text style={styles.quickTxt}>{t('START_PUSHUP')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.removeItem('@quest/list');
            await AsyncStorage.removeItem('@quest/date');
            await AsyncStorage.removeItem('@quest/awarded_walk');
            await loadOrGenQuests();
            await loadCoins();
          }}
          style={[styles.btn, { marginTop: 20, alignSelf: 'center', backgroundColor: '#ef4444' }]}
        >
          <Text style={styles.btnText}>{t('RESET_QUESTS')}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles=StyleSheet.create({
  screenTitle:{
    position:'absolute',left:0,right:0,textAlign:'center',color:'#000',
    fontSize:26,lineHeight:32,
    textShadowColor:'rgba(255,255,255,0.28)',textShadowOffset:{width:0,height:1},textShadowRadius:2,
    zIndex:10,fontFamily:FONT,fontWeight:'normal',includeFontPadding:true,
  },
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  card:{backgroundColor:'rgba(255,255,255,0.8)',borderRadius:24,padding:18,gap:12},
  title:{fontFamily:FONT,fontSize:20,lineHeight:24,color:'#111',includeFontPadding:true},
  questMain:{fontFamily:FONT,fontSize:28,lineHeight:34,color:'#111',includeFontPadding:true},
  barWrap:{height:26,borderWidth:2,borderColor:'#111',borderRadius:10,overflow:'hidden',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.05)'},
  barFill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'rgba(34,197,94,0.85)'},
  barText:{textAlign:'center',fontFamily:FONT,fontSize:14,lineHeight:17,color:'#111',includeFontPadding:true},
  quip:{fontFamily:FONT,fontSize:14,lineHeight:17,color:'#000',marginTop:2,includeFontPadding:true},

  quickRow:{ flexDirection:'row', gap:10 },
  quickBtn:{ flex:1, backgroundColor:'#111827', borderRadius:12, paddingVertical:12, alignItems:'center' },
  quickTxt:{ fontFamily:FONT, color:'#fff', fontSize:16, lineHeight:20, includeFontPadding:true },
  disabled:{ opacity:0.5 },

  btn:{paddingHorizontal:12,paddingVertical:6,backgroundColor:'#111827',borderRadius:8},
  btnText:{fontFamily:FONT,color:'#fff',fontSize:12,lineHeight:15,includeFontPadding:true},

  coinPill:{
    position:'absolute',
    right:12,
    backgroundColor:'rgba(17,24,39,0.9)',
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:10,
    paddingVertical:6,
    borderRadius:14,
    zIndex:20,
  },
  coinEmoji:{ fontSize:16, marginRight:6 },
  coinTxt:{ color:'#fff', fontFamily:FONT, fontSize:14, lineHeight:16, includeFontPadding:true },
});

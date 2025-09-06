import { useEffect, useRef, useState } from 'react'
import { View, Text, ImageBackground, StyleSheet, Animated, Platform, AppState, Linking, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts } from 'expo-font'

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
function dayKey(d=new Date()){const t=new Date(d);t.setHours(0,0,0,0);return `dist:${t.toISOString().slice(0,10)}`}
function haversine(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const s1=Math.sin(dLat/2),s2=Math.sin(dLon/2);const a=s1*s1+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*s2*s2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

export default function QuestScreen(){
  const insets=useSafeAreaInsets()
  const [fontsLoaded]=useFonts({[FONT]:require('../../assets/fonts/DungGeunMo.otf')})
  const [perm,setPerm]=useState('undetermined')
  const [meters,setMeters]=useState(0)
  const [sessionMeters,setSessionMeters]=useState(0)
  const [goalMeters,setGoalMeters]=useState(7000)
  const [quip,setQuip]=useState('')
  const [done,setDone]=useState(false)
  const anim=useRef(new Animated.Value(0)).current
  const watchRef=useRef(null)
  const lastRef=useRef(null)
  const appActiveRef=useRef(true)

  async function loadToday(){const v=await AsyncStorage.getItem(dayKey());return v?parseFloat(v)||0:0}
  async function saveToday(n){await AsyncStorage.setItem(dayKey(),String(Math.max(0,n||0)))}

  useEffect(()=>{setQuip(pick(TAUNTS.unavailable));const sub=AppState.addEventListener('change',s=>{appActiveRef.current=(s==='active')});return()=>sub?.remove?.()},[])
  useEffect(()=>{let mounted=true;(async()=>{try{const {status}=await Location.requestForegroundPermissionsAsync();if(!mounted)return;setPerm(status||'denied')}catch{if(!mounted)return;setPerm('denied')}})();return()=>{mounted=false}},[])
  useEffect(()=>{let mounted=true;if(perm!=='granted')return;(async()=>{
    const local=await loadToday();if(!mounted)return;setMeters(local)
    lastRef.current=null
    watchRef.current?.remove?.()
    watchRef.current=await Location.watchPositionAsync(
      {accuracy:Location.Accuracy.BestForNavigation,timeInterval:2000,distanceInterval:10,mayShowUserSettingsDialog:true},
      async pos=>{
        if(!mounted||!appActiveRef.current)return
        const {coords,timestamp}=pos||{}
        const {latitude,longitude,accuracy,speed}=coords||{}
        if(!(latitude&&longitude))return
        if(typeof accuracy==='number'&&accuracy>25)return
        const last=lastRef.current
        lastRef.current={lat:latitude,lon:longitude,t:timestamp||Date.now()}
        if(!last)return
        const now=timestamp||Date.now()
        const dt=Math.max(1,(now-(last.t||now))/1000)
        const d=haversine(last.lat,last.lon,latitude,longitude)
        const v=d/dt
        if(d<10||d>100)return
        const vOk=v>=0.7&&v<=4.5
        const sOk=typeof speed==='number'?speed>=0.7&&speed<=4.5:true
        if(!(vOk&&sOk))return
        setSessionMeters(vv=>vv+d)
        setMeters(prev=>{const next=prev+d;saveToday(next);return next})
      }
    )
  })();return()=>{mounted=false;watchRef.current?.remove?.()}},[perm])

  useEffect(()=>{const ratio=goalMeters>0?Math.min(meters/goalMeters,1):0;Animated.timing(anim,{toValue:ratio,duration:400,useNativeDriver:false}).start();const d=meters>=goalMeters;setDone(d);const r=goalMeters>0?meters/goalMeters:0;if(perm!=='granted')setQuip(pick(TAUNTS.unavailable));else if(d)setQuip(pick(TAUNTS.done));else if(meters===0)setQuip(pick(TAUNTS.none));else if(r<0.3)setQuip(pick(TAUNTS.low));else if(r<0.8)setQuip(pick(TAUNTS.mid));else setQuip(pick(TAUNTS.near))},[meters,goalMeters,perm])

  if(!fontsLoaded){
    return(
      <View style={[styles.center,{backgroundColor:'#000'}]}>
        <ActivityIndicator />
      </View>
    )
  }

  const width=anim.interpolate({inputRange:[0,1],outputRange:['0%','100%']})
  const km=(meters/1000).toFixed(2)
  const goalKm=(goalMeters/1000).toFixed(1)

  return(
    <ImageBackground source={require('../../assets/background/home.png')} style={{flex:1}} resizeMode="cover">
      <Text style={[styles.screenTitle,{top:insets.top+8}]}>QUEST</Text>
      <View style={{paddingTop:insets.top+88,paddingHorizontal:18,gap:16}}>
        <View style={styles.card}>
          <Text style={styles.title}>오늘의 퀘스트</Text>
          <Text style={styles.questMain}>{goalKm}km 걸으시오</Text>
          <View style={styles.barWrap}>
            <Animated.View style={[styles.barFill,{width}]}/>
            <Text style={styles.barText}>{km} / {goalKm} km</Text>
          </View>
          <Text style={styles.quip}>{quip}</Text>
          <Text style={styles.hint}>{perm==='granted'?'위치 사용 가능':'권한 필요: 위치'}</Text>
          {Platform.OS==='android'&&<Text style={styles.hint}>정확도 높음, 배터리 최적화 제외 권장</Text>}
          {perm!=='granted'&&<Text onPress={()=>Linking.openSettings()} style={[styles.hint,{textDecorationLine:'underline'}]}>설정 열기</Text>}
        </View>
        <View style={styles.subCard}>
          <Text style={styles.subTitle}>주간 업적</Text>
          <View style={styles.subRow}>
            <Text style={styles.subKey}>연속 달성</Text>
            <Text style={styles.subVal}>{done?'1 일':'0 일'}</Text>
          </View>
          <View style={styles.subRow}>
            <Text style={styles.subKey}>이번 주 총 거리</Text>
            <Text style={styles.subVal}>{((meters+sessionMeters)/1000).toFixed(2)} km</Text>
          </View>
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
  subTitle:{fontFamily:FONT,fontSize:18,color:'#111',fontWeight:'normal'},
  subRow:{flexDirection:'row',justifyContent:'space-between'},
  subKey:{fontFamily:FONT,fontSize:14,color:'#333',fontWeight:'normal'},
  subVal:{fontFamily:FONT,fontSize:14,color:'#111',fontWeight:'normal'}
})

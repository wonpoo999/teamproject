import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: W, height: H } = Dimensions.get('window')
const GAME_SEC = 45
const ITEM_SIZE = 36
const SPAWN_MS = 800
const BASKET_W = 112
const BASKET_H = 40
const SPEED_MIN = 180
const SPEED_MAX = 300

const FOOD = [
  { emoji:'🥗', good:true },
  { emoji:'🍎', good:true },
  { emoji:'🥕', good:true },
  { emoji:'🍅', good:true },
  { emoji:'🍩', good:false },
  { emoji:'🍟', good:false },
  { emoji:'🥤', good:false },
]

export default function HealthyCatchGameScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [timeLeft, setTimeLeft] = useState(GAME_SEC)
  const [score, setScore] = useState(0)
  const [miss, setMiss] = useState(0)
  const [over, setOver] = useState(false)
  const [combo, setCombo] = useState(0)
  const [items, setItems] = useState([])
  const basketX = useRef(W * 0.5).current
  const basketXRef = useRef(W * 0.5)
  const itemsRef = useRef([])
  const rafId = useRef(null)
  const spawnId = useRef(null)
  const timerId = useRef(null)
  const lastTs = useRef(0)
  const hitY = useMemo(() => Math.min(H * 0.72, H - insets.bottom - 220), [insets.bottom])

  useEffect(() => {
    timerId.current = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(timerId.current); endGame(); return 0 }
        return s - 1
      })
    }, 1000)
    spawnId.current = setInterval(spawn, SPAWN_MS)
    lastTs.current = Date.now()
    loop()
    return () => {
      clearInterval(timerId.current)
      clearInterval(spawnId.current)
      cancelAnimationFrame(rafId.current)
    }
  }, [])

  function spawn() {
    const type = Math.random() < 0.7
      ? FOOD.filter(f=>f.good)[Math.floor(Math.random()*4)]
      : FOOD.filter(f=>!f.good)[Math.floor(Math.random()*3)]
    const x = Math.random() * (W - ITEM_SIZE - 24) + 12
    const vy = SPEED_MIN + Math.random()*(SPEED_MAX - SPEED_MIN)
    const it = { id: `${Date.now()}_${Math.random()}`, x, y: -ITEM_SIZE, vy, emoji:type.emoji, good:type.good }
    itemsRef.current = [...itemsRef.current, it]
    setItems(itemsRef.current)
  }

  function loop() {
    const now = Date.now()
    const dt = Math.min(0.03, (now - lastTs.current) / 1000)
    lastTs.current = now
    const by = hitY
    const bw = BASKET_W
    const bh = BASKET_H
    const bx = basketXRef.current - bw/2
    const toRemove = new Set()
    for (let i=0;i<itemsRef.current.length;i++) {
      const it = itemsRef.current[i]
      it.y += it.vy * dt
      const ix = it.x
      const iy = it.y
      const collY = iy + ITEM_SIZE >= by && iy <= by + bh
      const collX = ix + ITEM_SIZE >= bx && ix <= bx + bw
      if (!it.caught && collY && collX) {
        it.caught = true
        toRemove.add(it.id)
        if (it.good) {
          setScore(s => s + 2 + Math.min(3, Math.floor(combo/5)))
          setCombo(c => c + 1)
        } else {
          setMiss(m => m + 1)
          setCombo(0)
        }
      }
      if (iy > H) {
        toRemove.add(it.id)
        if (it.good) {
          setMiss(m => m + 1)
          setCombo(0)
        }
      }
    }
    if (toRemove.size) {
      itemsRef.current = itemsRef.current.filter(it => !toRemove.has(it.id))
      setItems(itemsRef.current)
      if (miss + Array.from(toRemove).length >= 10) { endGame() }
    }
    rafId.current = requestAnimationFrame(loop)
  }

  function endGame() {
    if (over) return
    clearInterval(timerId.current)
    clearInterval(spawnId.current)
    cancelAnimationFrame(rafId.current)
    setOver(true)
  }

  function move(dx) {
    basketXRef.current = Math.max(BASKET_W/2, Math.min(W - BASKET_W/2, basketXRef.current + dx))
  }

  function holdMove(dir) {
    const step = () => { move(dir * 14); if (!over) holdId.current = requestAnimationFrame(step) }
    holdId.current = requestAnimationFrame(step)
  }
  const holdId = useRef(null)
  function stopHold() { if (holdId.current) { cancelAnimationFrame(holdId.current); holdId.current = null } }

  function retry() {
    itemsRef.current = []
    setItems([])
    basketXRef.current = W*0.5
    setTimeLeft(GAME_SEC)
    setScore(0)
    setMiss(0)
    setOver(false)
    setCombo(0)
    clearInterval(timerId.current)
    clearInterval(spawnId.current)
    cancelAnimationFrame(rafId.current)
    timerId.current = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(timerId.current); endGame(); return 0 }
        return s - 1
      })
    }, 1000)
    spawnId.current = setInterval(spawn, SPAWN_MS)
    lastTs.current = Date.now()
    loop()
  }

  return (
    <View style={{ flex:1, backgroundColor:'#071018', paddingTop: insets.top + 12 }}>
      <View style={{ alignItems:'center', gap:6 }}>
        <Text style={{ fontFamily:'DungGeunMo', fontSize:22, color:'#8fd4ff' }}>SALAD CATCH</Text>
        <View style={{ flexDirection:'row', gap:14 }}>
          <Text style={{ fontFamily:'DungGeunMo', fontSize:18, color:'#c7f9cc' }}>SCORE {score}</Text>
          <Text style={{ fontFamily:'DungGeunMo', fontSize:18, color:'#ffd166' }}>TIME {timeLeft}s</Text>
          <Text style={{ fontFamily:'DungGeunMo', fontSize:18, color:'#ff6b6b' }}>MISS {miss}/10</Text>
        </View>
      </View>

      <View style={{ flex:1, justifyContent:'center' }} pointerEvents="box-none">
        {items.map(it => (
          <View
            key={it.id}
            pointerEvents="none"
            style={{
              position:'absolute',
              left: it.x, top: it.y,
              width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: 10,
              alignItems:'center', justifyContent:'center',
              backgroundColor: it.good ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)'
            }}
          >
            <Text style={{ fontSize:22 }}>{it.emoji}</Text>
          </View>
        ))}
        <View
          pointerEvents="none"
          style={{
            position:'absolute',
            left: basketXRef.current - BASKET_W/2,
            top: hitY,
            width: BASKET_W,
            height: BASKET_H,
            backgroundColor:'#1f3b57',
            borderRadius:12,
            alignItems:'center',
            justifyContent:'center',
            borderWidth:2,
            borderColor:'#7aa0b8'
          }}
        >
          <Text style={{ fontSize:18, color:'#c7f9cc' }}>🧺</Text>
        </View>
      </View>

      <View style={{ flexDirection:'row', gap:10, padding:16, paddingBottom: insets.bottom + 12, zIndex:10, elevation:10 }}>
        <Pressable
          onPress={()=>move(-24)}
          onPressIn={()=>holdMove(-1)}
          onPressOut={stopHold}
          style={{ flex:1, paddingVertical:18, backgroundColor:'#134e4a', borderRadius:14, alignItems:'center' }}
        >
          <Text style={{ fontFamily:'DungGeunMo', fontSize:18, color:'#a7f3d0' }}>LEFT</Text>
        </Pressable>
        <Pressable
          onPress={()=>move(24)}
          onPressIn={()=>holdMove(1)}
          onPressOut={stopHold}
          style={{ flex:1, paddingVertical:18, backgroundColor:'#1e3a8a', borderRadius:14, alignItems:'center' }}
        >
          <Text style={{ fontFamily:'DungGeunMo', fontSize:18, color:'#bfdbfe' }}>RIGHT</Text>
        </Pressable>
      </View>

      {over && (
        <View style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.5)', alignItems:'center', justifyContent:'center', paddingHorizontal:24 }}>
          <View style={{ backgroundColor:'#0b1622', borderColor:'#7aa0b8', borderWidth:2, borderRadius:16, padding:20, width: Math.min(340, W - 40) }}>
            <Text style={{ fontFamily:'DungGeunMo', fontSize:20, color:'#8fd4ff', textAlign:'center' }}>RESULT</Text>
            <Text style={{ fontFamily:'DungGeunMo', fontSize:18, color:'#c7f9cc', textAlign:'center', marginTop:10 }}>Score {score}</Text>
            <View style={{ flexDirection:'row', gap:10, marginTop:16 }}>
              <Pressable onPress={retry} style={{ flex:1, paddingVertical:12, backgroundColor:'#1f3b57', borderRadius:10, alignItems:'center' }}>
                <Text style={{ fontFamily:'DungGeunMo', fontSize:16, color:'#8fd4ff' }}>RETRY</Text>
              </Pressable>
              <Pressable onPress={() => navigation.goBack()} style={{ flex:1, paddingVertical:12, backgroundColor:'#184a2b', borderRadius:10, alignItems:'center' }}>
                <Text style={{ fontFamily:'DungGeunMo', fontSize:16, color:'#c7f9cc' }}>EXIT</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

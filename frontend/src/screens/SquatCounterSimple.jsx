import { useEffect, useRef, useState } from "react"
import { View, Text, StyleSheet, Alert } from "react-native"
import { Accelerometer } from "expo-sensors"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function SquatCounterSimple({ route, navigation }) {
  const target = route?.params?.target || 10
  const [reps, setReps] = useState(0)
  const insets = useSafeAreaInsets()

  // ---- 튜닝 파라미터 (필요시 조정) ----
  const EMA_ALPHA = 0.15               // 낮을수록 더 부드럽게(노이즈 제거↑)
  const BASELINE_ALPHA = 0.01          // 서서히 기준선 적응
  const DOWN_DELTA = 0.35              // 하강 최소 깊이(g 단위 대략)
  const UP_DELTA = 0.20                // 상향 복귀 임계
  const MIN_REP_MS = 1200              // 1회 최소 소요시간(흔들기 차단)
  const MIN_BOTTOM_HOLD_MS = 200       // 바닥(스쿼트 최하점) 최소 버팀 시간
  const MAX_JERK_G = 1.2               // 갑작스런 흔들기(벡터 변화) 최대치
  const UPDATE_MS = 60                 // 샘플링 간격(더 촘촘하면 감지↑, 전력↓)

  // ---- 내부 상태 ----
  const lastTsRef = useRef(0)
  const emaYRef = useRef(0)
  const baselineRef = useRef(0)
  const phaseRef = useRef("idle")      // idle -> goingDown -> bottom -> goingUp
  const bottomTsRef = useRef(0)
  const repStartTsRef = useRef(0)
  const lastVecMagRef = useRef(0)

  function vecMag(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z)
  }

  useEffect(() => {
    Accelerometer.setUpdateInterval(UPDATE_MS)
    let first = true

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now()

      // 급격 흔들기 차단(폰만 흔드는 경우 컷)
      const m = vecMag(x, y, z)
      const lastM = lastVecMagRef.current || m
      const jerk = Math.abs(m - lastM)
      lastVecMagRef.current = m
      if (jerk > MAX_JERK_G) return

      // y축 사용(폰을 세로로 몸 앞에 쥔다 가정)
      // 1) EMA로 노이즈 제거
      if (first) {
        emaYRef.current = y
        baselineRef.current = y
        first = false
        repStartTsRef.current = now
        lastTsRef.current = now
        return
      }
      const emaY = emaYRef.current + EMA_ALPHA * (y - emaYRef.current)
      emaYRef.current = emaY

      // 2) baseline(서 있는 평균 자세) 천천히 추적
      if (phaseRef.current === "idle" || phaseRef.current === "goingUp") {
        baselineRef.current = baselineRef.current + BASELINE_ALPHA * (emaY - baselineRef.current)
      }
      const baseline = baselineRef.current

      const dy = emaY - baseline
      const phase = phaseRef.current

      // 3) 스테이트 머신
      if (phase === "idle") {
        // 충분히 내려가기 시작해야 goingDown 진입
        if (dy < -DOWN_DELTA * 0.5) {
          phaseRef.current = "goingDown"
          repStartTsRef.current = now
        }
      } else if (phase === "goingDown") {
        // 최하점 인식
        if (dy < -DOWN_DELTA) {
          phaseRef.current = "bottom"
          bottomTsRef.current = now
        }
        // 너무 빨리 위로 턴하면(가짜 흔들기) 초기화
        if (now - repStartTsRef.current < 250 && dy > 0) {
          phaseRef.current = "idle"
        }
      } else if (phase === "bottom") {
        // 바닥에서 최소 버팀
        const held = now - bottomTsRef.current
        // 위로 복귀 시작
        if (held >= MIN_BOTTOM_HOLD_MS && dy > -UP_DELTA) {
          phaseRef.current = "goingUp"
        }
      } else if (phase === "goingUp") {
        // 기준선 넘어 충분히 올라옴 확인
        if (dy > UP_DELTA * 0.6) {
          const repMs = now - repStartTsRef.current
          // 최소 시간 충족해야 인정(손목 털기 방지)
          if (repMs >= MIN_REP_MS) {
            const next = reps + 1
            setReps(next)
            phaseRef.current = "idle"
            repStartTsRef.current = now
            lastTsRef.current = now

            if (next >= target) {
              AsyncStorage.setItem("@quest/squat_done", "1")
              Alert.alert("완료", `스쿼트 ${target}회 달성!`, [
                { text: "OK", onPress: () => navigation.goBack() },
              ])
            }
          } else {
            // 너무 빠르면 무효 처리하고 초기화
            phaseRef.current = "idle"
            repStartTsRef.current = now
          }
        }
        // 위로 가다가 다시 깊게 내려가면 초기화
        if (dy < -DOWN_DELTA) {
          phaseRef.current = "goingDown"
          repStartTsRef.current = now
        }
      }

      lastTsRef.current = now
    })

    return () => sub && sub.remove()
  }, [reps, target, navigation])

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <Text style={styles.title}>SQUAT</Text>
      <Text style={styles.count}>
        {reps} / {target}
      </Text>
      <Text style={styles.hint}>
        📵 충분히 앉아(깊이) → 잠깐 버티고 → 완전히 일어나야 1회로 인정돼요.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  title: { color: "#fff", fontSize: 28, marginBottom: 20 },
  count: { color: "#0f0", fontSize: 60, fontWeight: "bold" },
  hint: { color: "#ccc", fontSize: 14, marginTop: 20, textAlign: "center", lineHeight: 20 },
})

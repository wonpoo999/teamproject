// src/screens/SitupCounterHand.jsx
import { View, Text, StyleSheet, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import useRepCounter from "../hooks/useRepCounter"
import { useEffect } from "react"

export default function SitupCounterHand({ route, navigation }) {
  const target = route?.params?.target || 10
  const insets = useSafeAreaInsets()

  const { reps, phase, calibrated, setReps } = useRepCounter({
    mode: "deltaAngle",
    target,
    thresholds: { up: 25, top: 55, down: 12 },
    minRepMs: 1200,
    holdMs: 220,
    minRangeDelta: 40,
    maxJerkG: 1.2,
    updateMs: 60,
    emaAlpha: 0.2,
  })

  useEffect(() => {
    if (reps >= target) {
      AsyncStorage.setItem("@quest/situp_done", "1")
      Alert.alert("완료", `윗몸 일으키기 ${target}회 달성!`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
      setReps(0)
    }
  }, [reps, target, navigation, setReps])

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <Text style={styles.title}>SIT-UP (HANDHELD)</Text>
      <Text style={styles.count}>{reps} / {target}</Text>
      <Text style={styles.hint}>{calibrated ? "충분히 세우고 잠깐 버틴 뒤 완전히 눕기!" : "⏱️ 캘리브레이션 중: 누운 자세로 2초간 가만히"}</Text>
      <Text style={styles.phase}>{phase.toUpperCase()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  title: { color: "#fff", fontSize: 24, marginBottom: 10 },
  count: { color: "#0f0", fontSize: 56, fontWeight: "bold" },
  hint: { color: "#ccc", fontSize: 14, marginTop: 16, textAlign: "center", lineHeight: 20 },
  phase: { color: "#888", fontSize: 12, marginTop: 8 }
})

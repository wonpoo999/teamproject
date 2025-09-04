import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Button,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { analyzeFoodImageWithGemini } from "../api/gemini";

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [shotUri, setShotUri] = useState(null);
  const [food, setFood] = useState(null);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();

  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerWrap} edges={["top", "bottom"]}>
        <Text style={styles.permTitle}>카메라 권한이 필요합니다</Text>
        <Text style={styles.permSub}>음식 사진을 찍어 칼로리를 추정하려면 카메라 접근을 허용해 주세요.</Text>
        <Button title="권한 허용" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  const takeAndAnalyze = async () => {
    try {
      if (!cameraRef.current || busy) return;
      setBusy(true);
      setFood(null);
      setError(null);
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: true });
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setShotUri(manipulated.uri);
      const result = await analyzeFoodImageWithGemini(manipulated.uri);
      setFood(result);
    } catch (e) {
      setError(e?.message ?? "분석 중 문제가 발생했어요.");
      Alert.alert("오류", e?.message ?? "분석 중 문제가 발생했어요.");
    } finally {
      setBusy(false);
    }
  };

  const resetShot = () => {
    setShotUri(null);
    setFood(null);
    setError(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <SafeAreaView edges={["top"]}>
          <View style={styles.topBar}>
            <Text style={styles.topHint}>접시가 프레임 가운데 오도록 맞춰보세요</Text>
          </View>
        </SafeAreaView>

        <View style={styles.guideWrap} pointerEvents="none">
          <View style={styles.guideBox} />
        </View>

        <SafeAreaView edges={["bottom"]} style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View style={styles.bottomBar}>
            {shotUri ? (
              <TouchableOpacity onPress={resetShot} style={styles.roundBtn}>
                <Text style={styles.roundBtnText}>↺</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.roundBtnPlaceholder} />
            )}

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                onPressIn={pressIn}
                onPressOut={pressOut}
                onPress={takeAndAnalyze}
                disabled={busy}
                activeOpacity={0.8}
                style={[styles.shutter, busy && { backgroundColor: "rgba(255,255,255,0.5)" }]}
              >
                {busy ? <ActivityIndicator /> : <View style={styles.shutterInner} />}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.roundBtnPlaceholder} />
          </View>
        </SafeAreaView>
      </CameraView>

      <SafeAreaView
        edges={["bottom"]}
        style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {busy && (
          <View style={styles.row}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.progressText}>Gemini가 사진을 분석 중…</Text>
          </View>
        )}

        {shotUri && !busy && (
          <Image source={{ uri: shotUri }} style={styles.thumb} resizeMode="cover" />
        )}

        {food && !busy && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>분석 결과</Text>
            <Text style={styles.foodRow}>
              🍽 음식: <Text style={styles.foodStrong}>{food.dish}</Text>
            </Text>
            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>🔥 {food.calories} kcal</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>P {food.protein}g</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>F {food.fat}g</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>C {food.carbs}g</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={resetShot} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>다시 찍기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takeAndAnalyze} disabled={busy} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>다시 분석</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error && !busy && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{error}</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#0b0b0b" },
  permTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#fff" },
  permSub: { fontSize: 14, color: "#ccc", textAlign: "center", marginBottom: 20 },
  topBar: { alignItems: "center", padding: 12 },
  topHint: { color: "#fff", fontSize: 14, opacity: 0.8 },
  guideWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  guideBox: { width: 220, height: 220, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)", borderRadius: 16 },
  bottomBar: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 40 },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  roundBtnText: { color: "#fff", fontSize: 20 },
  roundBtnPlaceholder: { width: 44, height: 44 },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#000" },
  panel: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: "rgba(0,0,0,0.7)" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  progressText: { color: "#fff", marginLeft: 8 },
  thumb: { width: "100%", height: 200, borderRadius: 10, marginBottom: 12 },
  card: { backgroundColor: "#111", borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 8 },
  foodRow: { fontSize: 16, color: "#fff", marginBottom: 8 },
  foodStrong: { fontWeight: "700", color: "#fff" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#222", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  chipText: { color: "#fff", fontSize: 14 },
  cardActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#333" },
  secondaryBtnText: { color: "#fff" },
  primaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#4CAF50" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  errBox: { backgroundColor: "#331111", padding: 12, borderRadius: 8, marginTop: 10 },
  errText: { color: "#ff8888" },
});

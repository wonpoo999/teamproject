import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Alert, Button } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { analyzeFoodImageWithGemini } from "../api/gemini";

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [busy, setBusy] = useState(false);
  const [shotUri, setShotUri] = useState(null);
  const [food, setFood] = useState(null);

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>카메라 권한이 필요합니다</Text>
        <Button title="권한 허용" onPress={requestPermission} />
      </View>
    );
  }

  const takeAndAnalyze = async () => {
    try {
      if (!cameraRef.current) return;
      setBusy(true);
      setFood(null);

      const photo = await cameraRef.current.takePictureAsync();
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setShotUri(manipulated.uri);

      const result = await analyzeFoodImageWithGemini(manipulated.uri);
      setFood(result);
    } catch (e) {
      Alert.alert("오류", e?.message ?? "분석 중 문제가 발생했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

      <View style={{ padding: 16, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <TouchableOpacity
          onPress={busy ? undefined : takeAndAnalyze}
          style={{
            backgroundColor: busy ? "#333" : "#111",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16 }}>{busy ? "분석 중…" : "📸 찍고 칼로리 추정"}</Text>
        </TouchableOpacity>

        {busy && (
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 8 }}>Gemini 분석 중…</Text>
          </View>
        )}

        {shotUri && !busy && (
          <Image source={{ uri: shotUri }} style={{ width: "100%", height: 220, marginTop: 12, borderRadius: 10 }} resizeMode="cover" />
        )}

        {food && !busy && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: "white", fontSize: 18 }}>
              🍽 음식: <Text style={{ fontWeight: "700" }}>{food.dish}</Text>
            </Text>
            <Text style={{ color: "white", fontSize: 16 }}>
              🔥 칼로리: {food.calories} kcal
            </Text>
            <Text style={{ color: "white", marginTop: 4 }}>
              ⚖️ P/F/C: {food.protein}g / {food.fat}g / {food.carbs}g
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

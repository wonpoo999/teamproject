import React, { useMemo } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';

// 로컬 분류(오타 방지)
function calcBMI(weightKg, heightCm) {
  const w = Number(weightKg); const h = Number(heightCm)/100;
  if (!w || !h) return null;
  return +(w/(h*h)).toFixed(1);
}
function classifyBMI(bmi) {
  if (bmi == null) return 'normal';
  if (bmi < 18.5) return 'thin';
  if (bmi < 23) return 'normal';
  if (bmi < 27.5) return 'chubby';
  return 'muscle';
}
function pickAvatar({ weight, height }) {
  const bmi = calcBMI(weight, height);
  return classifyBMI(bmi); // 'thin' | 'normal' | 'chubby' | 'muscle'
}

const SRC = {
  thin:    require('../../assets/characters/thin.png'),
  normal:  require('../../assets/characters/normal.png'),
  chubby:  require('../../assets/characters/chubby.png'),
  muscle:  require('../../assets/characters/muscle.png'),
};

/**
 * props:
 *  weight, height  => 아바타 선택
 *  offsetTop       => 진행바 기준 아래 여백 보정 (기본 12)
 *  scale           => 화면 높이 대비 비율(기본 0.36). 4번 스샷 비율에 맞춤
 */
export default function CharacterAvatar({
  weight, height, offsetTop = 12, scale = 0.36,
}) {
  const { height: H, width: W } = useWindowDimensions();
  const key = useMemo(() => pickAvatar({ weight, height }), [weight, height]);
  const source = SRC[key] || SRC.normal;

  // 세로 기준 스케일(상단 카드/바를 고려해 살짝 더 작게)
  const targetH = Math.round(H * scale);
  const ratio = 0.56; // 원본 비율 근사(폭/높이)
  const targetW = Math.round(targetH * ratio);

  return (
    <View
      style={{
        alignItems: 'center',
        marginTop: offsetTop,
        width: W,
      }}
      pointerEvents="none"
    >
      <Image
        source={source}
        resizeMode="contain"
        style={{
          width: targetW,
          height: targetH,
          transform: [{ translateY: 6 }], // 배경 기구 라인에 살짝 맞춤
        }}
      />
    </View>
  );
}

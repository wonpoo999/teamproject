// src/utils/body.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '../config/api';

/** BMI 계산 */
export function calcBMI(weightKg, heightCm) {
  const w = Number(weightKg);
  const hM = Number(heightCm) / 100;
  if (!w || !hM) return null;
  return +(w / (hM * hM)).toFixed(1);
}

/** BMI 분류 → thin | normal | muscle | chubby
 *  (기존 'chuby' 오탈자 교정. 'chuby' 들어오면 chubby로 보정)
 */
export function classifyBMI(bmi) {
  if (bmi == null) return 'normal';
  if (bmi < 18.5) return 'thin';
  // 23~27.4 는 운동/근육 이미지, 27.5 이상은 통통
  if (bmi < 27.5) return 'muscle';
  return 'chubby';
}

/** 서버/로컬에서 신체 기본값 가져오기 */
export async function getProfileBasics() {
  try {
    const prof = await apiGet('/api/profile');
    return {
      weightKg: prof?.weight ?? null,
      heightCm: prof?.height ?? null,
      gender: prof?.gender ?? null, // 'M' | 'F' | null
    };
  } catch {
    const raw = await AsyncStorage.getItem('@profile/prefill').catch(() => null);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        return {
          weightKg: p?.weight ?? null,
          heightCm: p?.height ?? null,
          gender: p?.gender ?? null,
        };
      } catch {}
    }
  }
  return { weightKg: null, heightCm: null, gender: null };
}

/** 현재 프로필 → 어떤 캐릭터를 쓸지 */
export function pickAvatar({ weightKg, heightCm, gender }) {
  // gender 는 현재 분기엔 쓰지 않지만 확장 여지를 남김
  const bmi = calcBMI(weightKg, heightCm);
  const cls = classifyBMI(bmi);
  // 과거 오탈자 호환
  return cls === 'chuby' ? 'chubby' : cls;
}

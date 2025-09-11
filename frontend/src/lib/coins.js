// 공통 코인 유틸 — 모든 화면에서 동일 키 사용
import AsyncStorage from '@react-native-async-storage/async-storage';

export const COINS_KEY = '@coins';

export async function getCoins() {
  const v = await AsyncStorage.getItem(COINS_KEY);
  return Number(v || 0);
}

export async function setCoins(n) {
  await AsyncStorage.setItem(COINS_KEY, String(Math.max(0, Number(n) || 0)));
}

export async function addCoins(delta) {
  const cur = await getCoins();
  const next = Math.max(0, cur + Number(delta || 0));
  await setCoins(next);
  return next;
}

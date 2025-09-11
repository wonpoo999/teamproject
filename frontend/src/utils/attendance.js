// src/utils/attendance.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  first: '@att/firstDate',
  last: '@att/lastDate',
  total: '@att/totalDays',
  streak: '@att/streak',
  monthKey: '@att/monthKey',
  monthStreak: '@att/monthStreak',
  monthDays: '@att/monthDays',
  coins: '@att/coins',
  todayCoins: '@att/todayCoins', // ★ 오늘 획득량(모든 출처)
};

// 로컬시간 00:00
const keyDay = (d = new Date()) => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 10);
};
const keyMonth = (d = new Date()) => keyDay(d).slice(0, 7);
const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const diffDays = (a, b) => {
  const pa = Date.parse(a + 'T00:00:00');
  const pb = Date.parse(b + 'T00:00:00');
  return Math.round((pb - pa) / 86400000);
};

/** 외부에서 코인 추가(퀘스트 등) → 전체/오늘 둘 다 반영 */
export async function addCoins(n) {
  const today = keyDay();
  const [last, cStr, tcStr] = await AsyncStorage.multiGet([K.last, K.coins, K.todayCoins]).then(a => a.map(([,v]) => v));
  let coins = Number(cStr || 0);
  let todayCoins = Number(tcStr || 0);
  if (last !== today) todayCoins = 0; // 날짜 바뀌면 오늘분 초기화
  coins += Number(n || 0);
  todayCoins += Number(n || 0);
  await AsyncStorage.multiSet([[K.coins, String(coins)], [K.todayCoins, String(todayCoins)]]);
  return { coins, todayCoins };
}

/** 규칙: 이틀마다 +1, 30일마다 +30, 해당 달 개근 시 +15 */
export async function checkInToday() {
  const today = keyDay();
  const mk = keyMonth();
  const dim = daysInMonth();

  const entries = await AsyncStorage.multiGet([
    K.first, K.last, K.total, K.streak, K.monthKey, K.monthStreak, K.monthDays, K.coins, K.todayCoins,
  ]);
  const map = Object.fromEntries(entries);

  let first = map[K.first];
  let last = map[K.last];
  let total = Number(map[K.total] || 0);
  let streak = Number(map[K.streak] || 0);
  let mKey = map[K.monthKey];
  let mStreak = Number(map[K.monthStreak] || 0);
  let mDays = Number(map[K.monthDays] || 0);
  let coins = Number(map[K.coins] || 0);
  let todayCoins = Number(map[K.todayCoins] || 0);

  // 오늘 첫 체크인?
  const firstToday = last !== today;

  if (firstToday) {
    // 날짜 바뀌면 오늘 코인 카운터 리셋
    todayCoins = 0;

    // 첫 체크인
    if (!first) first = today;

    const missed = !!last && diffDays(last, today) > 1;

    total += 1;
    streak = missed ? 1 : (streak + 1 || 1);
    if (streak > total) streak = total;

    const changedMonth = mKey !== mk;
    mStreak = changedMonth ? 1 : (missed ? 1 : (mStreak + 1 || 1));
    mDays = changedMonth ? 1 : (mDays + 1 || 1);
    mKey = mk;

    // 보너스
    let bonus = 0;
    if (total % 2 === 0) bonus += 1;
    if (total % 30 === 0) bonus += 30;
    if (mStreak === dim) bonus += 15;

    coins += bonus;
    todayCoins += bonus;

    await AsyncStorage.multiSet([
      [K.first, first],
      [K.last, today],
      [K.total, String(total)],
      [K.streak, String(streak)],
      [K.monthKey, mKey],
      [K.monthStreak, String(mStreak)],
      [K.monthDays, String(mDays)],
      [K.coins, String(coins)],
      [K.todayCoins, String(todayCoins)],
    ]);
  } else {
    // 이미 오늘 체크인 되어 있으면 아무것도 안 바꿈
  }

  return getStatus();
}

export async function getStatus() {
  const map = Object.fromEntries(
    await AsyncStorage.multiGet([
      K.first, K.last, K.total, K.streak, K.monthKey, K.monthStreak, K.monthDays, K.coins, K.todayCoins,
    ])
  );

  let total = Number(map[K.total] || 0);
  let streak = Math.min(Number(map[K.streak] || 0), total);

  return {
    firstDate: map[K.first] || null,
    lastDate: map[K.last] || null,
    totalDays: total,
    currentStreak: streak,
    monthKey: map[K.monthKey] || keyMonth(),
    monthStreak: Number(map[K.monthStreak] || 0),
    monthDays: Number(map[K.monthDays] || 0),
    coins: Number(map[K.coins] || 0),
    todayCoins: Number(map[K.todayCoins] || 0),
  };
}

export async function spendCoins(n) {
  const st = await getStatus();
  if (st.coins < n) return false;
  await AsyncStorage.setItem(K.coins, String(st.coins - n));
  // 사용은 todayCoins 에서 빼지 않음(획득량만 집계)
  return true;
}

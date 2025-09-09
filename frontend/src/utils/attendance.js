// [ADDED] Attendance + coin logic (local; 서버 연동 교체 용이)
import AsyncStorage from '@react-native-async-storage/async-storage';
const K = {
  first: '@att/firstDate', last: '@att/lastDate', total: '@att/totalDays', streak: '@att/streak',
  monthKey: '@att/monthKey', monthStreak: '@att/monthStreak', monthDays: '@att/monthDays', coins: '@att/coins',
};
const keyDay = (d = new Date()) => { const t = new Date(d); t.setHours(0,0,0,0); return t.toISOString().slice(0,10); };
const keyMonth = (d = new Date()) => { const t = new Date(d); t.setHours(0,0,0,0); return t.toISOString().slice(0,7); };
const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();

// 규칙: 이틀마다 +1, 총 30일마다 +30, 해당 달 개근(달 일수만큼 연속) +15
export async function checkInToday() {
  const today = keyDay(), mk = keyMonth(), dim = daysInMonth();
  const entries = await AsyncStorage.multiGet([K.first,K.last,K.total,K.streak,K.monthKey,K.monthStreak,K.monthDays,K.coins]);
  const map = Object.fromEntries(entries);
  let total = Number(map[K.total]||0), streak = Number(map[K.streak]||0), mKey = map[K.monthKey], mStreak = Number(map[K.monthStreak]||0);
  let mDays = Number(map[K.monthDays]||0), coins = Number(map[K.coins]||0), last = map[K.last];

  if (last === today) return getStatus();

  const yday = keyDay(new Date(new Date(today).getTime()-86400000));
  const missed = last && last !== yday;
  total += 1;
  streak = missed ? 1 : (streak + 1 || 1);

  const changedMonth = mKey !== mk;
  mStreak = changedMonth ? 1 : (missed ? 1 : (mStreak + 1 || 1));
  mDays   = changedMonth ? 1 : (mDays + 1 || 1);

  if (total % 2 === 0) coins += 1;
  if (total % 30 === 0) coins += 30;
  if (mStreak === dim) coins += 15;

  await AsyncStorage.multiSet([
    [K.first, map[K.first] || today], [K.last, today], [K.total, String(total)], [K.streak, String(streak)],
    [K.monthKey, mk], [K.monthStreak, String(mStreak)], [K.monthDays, String(mDays)], [K.coins, String(coins)],
  ]);
  return getStatus();
}
export async function getStatus() {
  const map = Object.fromEntries(await AsyncStorage.multiGet([K.first,K.last,K.total,K.streak,K.monthKey,K.monthStreak,K.monthDays,K.coins]));
  return {
    firstDate: map[K.first] || null, lastDate: map[K.last] || null, totalDays: Number(map[K.total]||0),
    currentStreak: Number(map[K.streak]||0), monthKey: map[K.monthKey]||keyMonth(),
    monthStreak: Number(map[K.monthStreak]||0), monthDays: Number(map[K.monthDays]||0), coins: Number(map[K.coins]||0),
  };
}
export async function spendCoins(n) {
  const c = Number((await AsyncStorage.getItem(K.coins))||0);
  if (c < n) return false; await AsyncStorage.setItem(K.coins, String(c-n)); return true;
}

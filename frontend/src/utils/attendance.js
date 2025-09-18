// src/utils/attendance.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ORIGIN } from '../config/api';

const K = {
  first: '@att/firstDate',
  last: '@att/lastDate',
  total: '@att/totalDays',
  streak: '@att/streak',
  monthKey: '@att/monthKey',
  monthStreak: '@att/monthStreak',
  monthDays: '@att/monthDays',
  coins: '@att/coins',
  todayCoins: '@att/todayCoins',
  syncedFirst: '@att/syncedFirstOnce',
  syncedStatus: '@att/syncedStatusOnce',
};

const keyDay   = (d = new Date()) => { const t = new Date(d); t.setHours(0,0,0,0); return t.toISOString().slice(0,10); };
const keyMonth = (d = new Date()) => keyDay(d).slice(0,7);
const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
const diffDays = (a, b) => Math.round((Date.parse(b+'T00:00:00') - Date.parse(a+'T00:00:00'))/86400000);

async function readMap() {
  const arr = await AsyncStorage.multiGet(Object.values(K));
  return Object.fromEntries(arr);
}
async function writeMap(obj) {
  const pairs = Object.entries(obj).map(([k,v]) => [k, String(v)]);
  await AsyncStorage.multiSet(pairs);
}

async function getAuthHeader() {
  try {
    const s = await SecureStore.getItemAsync('accessToken');
    if (s) {
      const m = String(s).match(/^(Bearer|Basic|Token)\s+(.+)$/i);
      return { Authorization: m ? `${m[1]} ${m[2]}` : `Bearer ${s}` };
    }
  } catch {}
  for (const k of ['token','authToken','@auth/token']) {
    const v = await AsyncStorage.getItem(k);
    if (v) {
      const m = String(v).match(/^(Bearer|Basic|Token)\s+(.+)$/i);
      return { Authorization: m ? `${m[1]} ${m[2]}` : `Bearer ${v}` };
    }
  }
  return {};
}

/** 서버에서 첫 로그인일만 보정 (1회) */
async function trySyncFirstFromServer() {
  const synced = await AsyncStorage.getItem(K.syncedFirst);
  if (synced === '1') return;

  try {
    const headers = { Accept: 'application/json', ...(await getAuthHeader()) };
    const res = await fetch(`${ORIGIN}/api/attendance/first-login`, { headers });
    if (!res.ok) throw new Error();
    const j = await res.json().catch(()=>null);
    const f = j?.firstDate ? String(j.firstDate).slice(0,10) : null;
    if (f) {
      const m = await readMap();
      const localFirst = m[K.first];
      const nextFirst = (!localFirst || f < localFirst) ? f : localFirst;
      await writeMap({ [K.first]: nextFirst || f });
    }
  } catch {}
  await AsyncStorage.setItem(K.syncedFirst, '1');
}

/** (선택) 서버 상태 동기화 (제공 시) 1회 */
export async function syncStatusFromServerOnce() {
  const synced = await AsyncStorage.getItem(K.syncedStatus);
  if (synced === '1') return;

  try {
    const headers = { Accept: 'application/json', ...(await getAuthHeader()) };
    const res = await fetch(`${ORIGIN}/api/attendance/status`, { headers });
    if (!res.ok) throw new Error();
    const j = await res.json().catch(()=>null);
    if (j) {
      const today = keyDay();
      const m = await readMap();
      await writeMap({
        [K.first]: j.firstDate || m[K.first] || today,
        [K.last]:  j.lastDate  || m[K.last]  || today,
        [K.total]: Number(j.totalDays || m[K.total] || 0),
        [K.streak]: Number(j.currentStreak || m[K.streak] || 0),
        [K.monthKey]: m[K.monthKey] || keyMonth(),
        [K.monthStreak]: Number(m[K.monthStreak] || 0),
        [K.monthDays]: Number(m[K.monthDays] || 0),
        [K.coins]: Number(m[K.coins] || 0),
        [K.todayCoins]: Number(m[K.todayCoins] || 0),
      });
    }
  } catch {}
  await AsyncStorage.setItem(K.syncedStatus, '1');
}

/** total/streak/coins 정합성 보정 (첫날 보정 이후 “4일 고정” 같은 문제 해결) */
async function ensureCoherent() {
  const today = keyDay();
  const mk = keyMonth();
  const dim = daysInMonth();

  const m = await readMap();

  let first = m[K.first] || today;
  let last  = m[K.last]  || today;
  let total = Number(m[K.total] || 0);
  let streak= Number(m[K.streak] || 0);
  let mKey  = m[K.monthKey] || mk;
  let mStreak = Number(m[K.monthStreak] || 0);
  let mDays   = Number(m[K.monthDays] || 0);
  let coins   = Number(m[K.coins] || 0);
  let todayCoins = Number(m[K.todayCoins] || 0);

  // 🔧 첫날 기준으로 통산 최소값 보정: diff+1 이상이 되도록
  if (first && first <= today) {
    const minTotal = diffDays(first, today) + 1;
    if (!Number.isFinite(total) || total < minTotal) total = minTotal;
    if (!Number.isFinite(streak) || streak <= 0) streak = 1;
    if (streak > total) streak = total;
  }

  // 마지막 접속일은 오늘로 보정(최소)
  if (last !== today) last = today;

  // 월 키 초기화
  if (!mKey) mKey = mk;

  // 코인 기대치(과거 월 개근 보너스는 알 수 없어 “현재 달”만 반영)
  const evenBonusAll = Math.floor(total / 2);
  const thirtyBonusAll = Math.floor(total / 30) * 30;
  const monthBonus = (mKey === mk && mStreak === dim) ? 15 : 0;
  const expected = evenBonusAll + thirtyBonusAll + monthBonus;

  if (!Number.isFinite(coins) || coins < expected) coins = expected;
  if (!Number.isFinite(todayCoins) || todayCoins < 0) todayCoins = 0;

  await writeMap({
    [K.first]: first, [K.last]: last,
    [K.total]: total, [K.streak]: streak,
    [K.monthKey]: mKey, [K.monthStreak]: mStreak, [K.monthDays]: mDays,
    [K.coins]: coins, [K.todayCoins]: todayCoins,
  });
}

// ---- 외부 API ----
export async function addCoins(n=0) {
  const today = keyDay();
  const m = await readMap();
  let coins = Number(m[K.coins] || 0);
  let todayCoins = Number(m[K.todayCoins] || 0);
  const last = m[K.last];

  if (last !== today) todayCoins = 0;
  coins += Number(n || 0);
  todayCoins += Number(n || 0);

  await writeMap({ [K.coins]: coins, [K.todayCoins]: todayCoins, [K.last]: last || today });
  return { coins, todayCoins };
}

/** 규칙: 2일마다 +1, 30일마다 +30, 해당 달 개근 시 +15 */
export async function checkInToday() {
  await trySyncFirstFromServer();
  await syncStatusFromServerOnce();
  await ensureCoherent();

  const today = keyDay();
  const mk = keyMonth();
  const dim = daysInMonth();
  const m = await readMap();

  let first = m[K.first] || today;
  let last  = m[K.last]  || today;
  let total = Number(m[K.total] || 0);
  let streak= Number(m[K.streak] || 0);
  let mKey  = m[K.monthKey] || mk;
  let mStreak = Number(m[K.monthStreak] || 0);
  let mDays   = Number(m[K.monthDays] || 0);
  let coins   = Number(m[K.coins] || 0);
  let todayCoins = Number(m[K.todayCoins] || 0);

  const firstToday = last !== today;

  if (firstToday) {
    todayCoins = 0;
    const missed = !!last && diffDays(last, today) > 1;

    total = (Number.isFinite(total) ? total : 0) + 1;
    streak = missed ? 1 : (Number.isFinite(streak) && streak > 0 ? streak + 1 : 1);
    if (streak > total) streak = total;

    const changedMonth = mKey !== mk;
    mStreak = changedMonth ? 1 : (missed ? 1 : (Number.isFinite(mStreak) && mStreak > 0 ? mStreak + 1 : 1));
    mDays   = changedMonth ? 1 : (Number.isFinite(mDays) ? mDays + 1 : 1);
    mKey    = mk;

    // 보상
    let bonus = 0;
    if (total % 2 === 0) bonus += 1;
    if (total % 30 === 0) bonus += 30;
    if (mStreak === dim)  bonus += 15;

    coins += bonus;
    todayCoins += bonus;

    await writeMap({
      [K.first]: first,
      [K.last]:  today,
      [K.total]: total,
      [K.streak]: streak,
      [K.monthKey]: mKey,
      [K.monthStreak]: mStreak,
      [K.monthDays]: mDays,
      [K.coins]: coins,
      [K.todayCoins]: todayCoins,
    });
  }

  // 한번 더 정합성 점검(특히 “첫날만 과거로 보정되던” 케이스)
  await ensureCoherent();
  return getStatus();
}

export async function getStatus() {
  await ensureCoherent();
  const m = await readMap();
  const first = m[K.first] || null;
  const last  = m[K.last]  || null;
  let total   = Number(m[K.total] || 0);
  let streak  = Number(m[K.streak] || 0);
  const mk    = m[K.monthKey] || keyMonth();
  const ms    = Number(m[K.monthStreak] || 0);
  const md    = Number(m[K.monthDays] || 0);
  const coins = Number(m[K.coins] || 0);
  const todayCoins = Number(m[K.todayCoins] || 0);

  if (total <= 0 && streak > 0) total = streak;
  if (streak > total) streak = total;

  return {
    firstDate: first,
    lastDate: last,
    totalDays: total,
    currentStreak: Math.max(0, streak),
    monthKey: mk,
    monthStreak: ms,
    monthDays: md,
    coins,
    todayCoins,
  };
}

export async function spendCoins(n) {
  const m = await readMap();
  const coins = Number(m[K.coins] || 0);
  if (coins < n) return false;
  await writeMap({ [K.coins]: coins - n });
  return true;
}

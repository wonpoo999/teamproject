// src/utils/attendance.js — 최종본 (KST·토큰키·/calendar 우선·POST /checkin 반영)
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ORIGIN } from '../config/api';

const K = {
  first: '@att/firstDate',
  last: '@att/lastDate',
  total: '@att/totalDays',
  streak: '@att/streak',
  coins: '@att/coins',
  todayCoins: '@att/todayCoins',
  syncedFirst: '@att/syncedFirstOnce',
  syncedStatus: '@att/syncedStatusOnce',
  // per-month: @att/log/2025-09 => [1,5,9,...]
};

// ---- KST 안전한 날짜 포맷 ----
const pad = (n) => String(n).padStart(2, '0');
const toKstDate = (d = new Date()) => {
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utcMs + 9 * 60 * 60000);
};
export const dayKey = (d = new Date()) => {
  const k = toKstDate(d);
  const y = k.getUTCFullYear();
  const m = pad(k.getUTCMonth() + 1);
  const dd = pad(k.getUTCDate());
  return `${y}-${m}-${dd}`;
};
export const monthKey = (d = new Date()) => dayKey(d).slice(0, 7);

async function readMany(keys) {
  const arr = await AsyncStorage.multiGet(keys);
  return Object.fromEntries(arr);
}
async function writeMany(obj) {
  await AsyncStorage.multiSet(Object.entries(obj).map(([k, v]) => [k, String(v)]));
}
const authHeader = async () => {
  try {
    const s = await SecureStore.getItemAsync('accessToken');
    if (s) {
      const m = String(s).match(/^(Bearer|Basic|Token)\s+(.+)$/i);
      return { Authorization: m ? `${m[1]} ${m[2]}` : `Bearer ${s}` };
    }
  } catch {}
  // << 토큰 저장키 전부 탐색: '@token' 포함 >>
  for (const k of ['@token', 'token', 'authToken', '@auth/token']) {
    const v = await AsyncStorage.getItem(k);
    if (v) {
      const m = String(v).match(/^(Bearer|Basic|Token)\s+(.+)$/i);
      return { Authorization: m ? `${m[1]} ${m[2]}` : `Bearer ${v}` };
    }
  }
  return {};
};

async function getEmail() {
  try {
    const r = await fetch(`${ORIGIN}/api/profile`, { headers: { Accept: 'application/json', ...(await authHeader()) } });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      const id = j?.id || j?.email;
      if (id) return String(id);
    }
  } catch {}
  try {
    const raw = await AsyncStorage.getItem('@profile/prefill');
    if (raw) {
      const j = JSON.parse(raw);
      if (j?.id || j?.email) return String(j.id || j.email);
    }
  } catch {}
  const last = await AsyncStorage.getItem('last_user_id');
  return last || '';
}

// ---------- 서버 동기화 (오늘로 덮어쓰기 절대 금지) ----------
export async function syncFirstFromServer() {
  try {
    const email = await getEmail();
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    const r = await fetch(`${ORIGIN}/api/attendance/first-login${q}`, {
      headers: { Accept: 'application/json', ...(await authHeader()) },
    });
    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    const serverFirst = j?.firstDate ? String(j.firstDate).slice(0, 10) : null;
    if (!serverFirst) return false;

    const cur = await AsyncStorage.getItem(K.first);
    const next = cur ? (cur < serverFirst ? cur : serverFirst) : serverFirst; // 절대 뒤로 미루지 않음
    await AsyncStorage.setItem(K.first, next);
    await AsyncStorage.setItem(K.syncedFirst, '1');
    return true;
  } catch {
    return false;
  }
}

export async function syncStatusFromServer() {
  try {
    const email = await getEmail();
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    const r = await fetch(`${ORIGIN}/api/attendance/status${q}`, {
      headers: { Accept: 'application/json', ...(await authHeader()) },
    });
    if (!r.ok) return false;

    const j = await r.json().catch(() => null);
    if (!j) return false;

    const cur = await readMany([K.first, K.last, K.total, K.streak, K.coins, K.todayCoins]);
    const data = {};
    if (j.firstDate) data[K.first] = String(j.firstDate).slice(0, 10);
    if (j.lastDate) data[K.last] = String(j.lastDate).slice(0, 10);
    if (j.totalDays != null) data[K.total] = Number(j.totalDays);
    if (j.currentStreak != null) data[K.streak] = Number(j.currentStreak);
    if (j.coins != null) data[K.coins] = Number(j.coins);
    data[K.todayCoins] = Number(j.todayCoins ?? cur[K.todayCoins] ?? 0);

    await writeMany({ ...cur, ...data });
    await AsyncStorage.setItem(K.syncedStatus, '1');
    return true;
  } catch {
    return false;
  }
}

// 앱 시작 시 1회 강제 동기화(프로필 첫날이 오늘로 뜨는 문제 방지)
export async function initialSyncAttendance() {
  const okFirst = await syncFirstFromServer();
  const okStatus = await syncStatusFromServer();
  if (!okFirst) await AsyncStorage.setItem(K.syncedFirst, '0');
  if (!okStatus) await AsyncStorage.setItem(K.syncedStatus, '0');
}

// ---------- 로컬 유틸 ----------
const logKey = (ym) => `@att/log/${ym}`;
async function addToMonthLog(dateStr) {
  const ym = dateStr.slice(0, 7);
  const day = Number(dateStr.slice(8, 10));
  try {
    const raw = await AsyncStorage.getItem(logKey(ym));
    const arr = raw ? JSON.parse(raw) : [];
    if (!arr.includes(day)) {
      arr.push(day);
      arr.sort((a, b) => a - b);
      await AsyncStorage.setItem(logKey(ym), JSON.stringify(arr));
    }
  } catch {}
}

// ---------- 체크인(서버 우선: POST /checkin) ----------
export async function checkInToday() {
  const today = dayKey();
  // 서버 기록 시도
  try {
    const email = await getEmail();
    const body = email ? { date: today, email } : { date: today };
    const r = await fetch(`${ORIGIN}/api/attendance/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(await authHeader()) },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j) {
        // 상태 반영
        const cur = await readMany([K.first, K.last, K.total, K.streak, K.coins, K.todayCoins]);
        const data = {};
        if (j.firstDate) data[K.first] = String(j.firstDate).slice(0, 10);
        if (j.lastDate) data[K.last] = String(j.lastDate).slice(0, 10);
        if (j.totalDays != null) data[K.total] = Number(j.totalDays);
        if (j.currentStreak != null) data[K.streak] = Number(j.currentStreak);
        if (j.coins != null) data[K.coins] = Number(j.coins);
        data[K.todayCoins] = Number(j.todayCoins ?? 0);
        await writeMany({ ...cur, ...data });
        await addToMonthLog(today);
        return getStatus();
      }
    }
  } catch {}

  // 서버 실패 시: 보수적 로컬 갱신 (첫날은 서버 동기화에서만 결정)
  await syncFirstFromServer();
  const m = await readMany([K.first, K.last, K.total, K.streak, K.coins]);
  const last = m[K.last];
  const sameDay = last === today;

  let total = Number(m[K.total] || 0);
  let streak = Number(m[K.streak] || 0);
  let coins = Number(m[K.coins] || 0);
  let todayCoins = 0;

  if (!sameDay) {
    total += 1;
    const diff = last ? Math.round((Date.parse(today) - Date.parse(last)) / 86400000) : 0;
    streak = !last ? Math.max(1, streak) : (diff > 1 ? 1 : (streak > 0 ? streak + 1 : 1));

    if (total % 2 === 0) { coins += 1; todayCoins += 1; }
    if (total % 30 === 0) { coins += 30; todayCoins += 30; }

    await writeMany({
      [K.last]: today,
      [K.total]: total,
      [K.streak]: streak,
      [K.coins]: coins,
      [K.todayCoins]: todayCoins,
    });
    await addToMonthLog(today);
  } else {
    await AsyncStorage.setItem(K.todayCoins, String(0));
  }

  return getStatus();
}

export async function getStatus() {
  const m = await readMany([K.first, K.last, K.total, K.streak, K.coins, K.todayCoins]);
  return {
    firstDate: m[K.first] || null,
    lastDate: m[K.last] || null,
    totalDays: Number(m[K.total] || 0),
    currentStreak: Number(m[K.streak] || 0),
    coins: Number(m[K.coins] || 0),
    todayCoins: Number(m[K.todayCoins] || 0),
  };
}

export async function addCoins(n = 0) {
  const m = await readMany([K.coins, K.todayCoins, K.last]);
  const today = dayKey();
  let coins = Number(m[K.coins] || 0);
  let todayCoins = Number(m[K.todayCoins] || 0);
  if (m[K.last] !== today) todayCoins = 0;
  coins += Number(n || 0); todayCoins += Number(n || 0);
  await writeMany({ [K.coins]: coins, [K.todayCoins]: todayCoins, [K.last]: today });
  return { coins, todayCoins };
}

export async function spendCoins(n) {
  const m = await readMany([K.coins]);
  const coins = Number(m[K.coins] || 0);
  if (coins < n) return false;
  await AsyncStorage.setItem(K.coins, String(coins - n));
  return true;
}

// 월 달력: /calendar(우선) → /history → 로컬
export async function getMonthLog(ym = monthKey()) {
  // YYYY-MM 보장
  if (!/^\d{4}-\d{2}$/.test(ym)) return [];
  const hdrs = { Accept: 'application/json', ...(await authHeader()) };
  const email = await getEmail();
  const qEmail = email ? `&email=${encodeURIComponent(email)}` : '';

  // 1) /calendar → { days:[1,5,9,...] }
  try {
    const r = await fetch(`${ORIGIN}/api/attendance/calendar?month=${encodeURIComponent(ym)}${qEmail}`, { headers: hdrs });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (Array.isArray(j?.days)) return j.days.map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
      if (Array.isArray(j?.dates)) {
        return j.dates.map(d => Number(String(d).slice(8,10))).filter(Number.isFinite).sort((a,b)=>a-b);
      }
    }
  } catch {}

  // 2) /history → { dates:["YYYY-MM-DD", ...] }
  try {
    const r2 = await fetch(`${ORIGIN}/api/attendance/history?month=${encodeURIComponent(ym)}${qEmail}`, { headers: hdrs });
    if (r2.ok) {
      const j2 = await r2.json().catch(() => null);
      if (Array.isArray(j2?.dates)) {
        return j2.dates.map(d => Number(String(d).slice(8,10))).filter(Number.isFinite).sort((a,b)=>a-b);
      }
    }
  } catch {}

  // 3) 로컬 폴백
  try {
    const raw = await AsyncStorage.getItem(`@att/log/${ym}`);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(Number).filter(Number.isFinite).sort((a,b)=>a-b) : [];
  } catch { return []; }
}

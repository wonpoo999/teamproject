// api.js
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// 사설 IP인지 체크
function isPrivateIp(h) {
  return !!h && /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(h);
}

// 1) Expo가 알려주는 hostUri에서 호스트 추출 (SDK별 위치 다름)
function getHostFromExpo() {
  const c = Constants || {};
  const uri =
    (c.expoConfig && c.expoConfig.hostUri) ||
    (c.manifest2 && c.manifest2.extra && c.manifest2.extra.expoClient && c.manifest2.extra.expoClient.hostUri) ||
    (c.manifest && c.manifest.hostUri);
  if (!uri) return undefined;
  try { return String(uri).split(':')[0]; } catch { return undefined; }
}

// 2) Metro scriptURL에서 호스트 추출
function getHostFromScriptURL() {
  const u = NativeModules?.SourceCode?.scriptURL;
  if (!u) return undefined;
  try { return new URL(u).hostname; } catch { return undefined; }
}

// 최종 ORIGIN 결정
function getDevOrigin() {
  // (A) 가장 안전: 공개 환경변수로 강제 (app.json 에 넣으면 빌드/런타임에서 사용 가능)
  const env = process.env.EXPO_PUBLIC_API_ORIGIN;
  if (env) return env.replace(/\/+$/, '');

  // (B) Expo가 넘겨준 hostUri가 사설 IP면 채택
  const expoHost = getHostFromExpo();
  if (isPrivateIp(expoHost)) return `http://${expoHost}:8080`;

  // (C) Metro scriptURL이 사설 IP면 채택
  const metroHost = getHostFromScriptURL();
  if (isPrivateIp(metroHost)) return `http://${metroHost}:8080`;

  // (D) 마지막 폴백 (에뮬레이터만 의미 있음)
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}

const ORIGIN = __DEV__ ? getDevOrigin() : 'https://your-prod.example.com';

const join = (base, path) =>
  `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;

export async function apiGet(path, init) {
  const url = join(ORIGIN, path);  // path에 항상 /api/... 포함해서 넘겨
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { ...(init || {}), method: 'GET', signal: ctrl.signal });
    const text = await res.text();
    if (__DEV__) console.log('GET', url, '->', res.status, text);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text}`);
    try { return JSON.parse(text); } catch { return text; }
  } finally { clearTimeout(to); }
}

export async function apiPost(path, body, init) {
  const url = join(ORIGIN, path);  // path에 항상 /api/... 포함해서 넘겨
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      ...(init || {}),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...((init && init.headers) || {}) },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (__DEV__) console.log('POST', url, '->', res.status, text);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text}`);
    try { return JSON.parse(text); } catch { return text; }
  } finally { clearTimeout(to); }
}

export const API_BASE_DEBUG = ORIGIN;

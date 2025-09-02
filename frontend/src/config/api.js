import { Platform, NativeModules } from "react-native";
import Constants from "expo-constants";

function isPrivateIp(h) {
  return !!h && /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(h);
}

function getHostFromExpo() {
  const c = Constants || {};
  const uri =
    (c.expoConfig && c.expoConfig.hostUri) ||
    (c.manifest2 && c.manifest2.extra && c.manifest2.extra.expoClient && c.manifest2.extra.expoClient.hostUri) ||
    (c.manifest && c.manifest.hostUri);
  if (!uri) return undefined;
  const m = String(uri).match(/^([^:\/?#]+)(?::\d+)?/);
  return m ? m[1] : undefined;
}

function getHostFromScriptURL() {
  const u = NativeModules?.SourceCode?.scriptURL;
  if (!u) return undefined;
  try { return new URL(u).hostname; } catch { return undefined; }
}

function getExtraApiOrigin() {
  const ex =
    (Constants.expoConfig && Constants.expoConfig.extra) ||
    (Constants.manifest && Constants.manifest.extra) ||
    {};
  return ex.apiOrigin || ex.EXPO_PUBLIC_API_ORIGIN || null;
}

function normalizeOrigin(v) {
  return v ? String(v).replace(/\/+$/, "") : v;
}

function getDevOrigin() {
  const fromExtra = normalizeOrigin(getExtraApiOrigin());
  if (fromExtra) return fromExtra;
  const fromEnv = normalizeOrigin(process.env.EXPO_PUBLIC_API_ORIGIN);
  if (fromEnv) return fromEnv;
  const expoHost = getHostFromExpo();
  if (isPrivateIp(expoHost)) return `http://${expoHost}:8080`;
  const metroHost = getHostFromScriptURL();
  if (isPrivateIp(metroHost)) return `http://${metroHost}:8080`;
  if (Platform.OS === "android") return "http://10.0.2.2:8080";
  return "http://localhost:8080";
}

const ORIGIN = __DEV__ ? getDevOrigin() : "https://your-prod.example.com";

const join = (base, path) =>
  `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;

let CURRENT_TOKEN = null;

export function setAuthToken(t) {
  CURRENT_TOKEN = t || null;
}

export function clearAuthToken() {
  CURRENT_TOKEN = null;
}

function withAuthHeaders(init) {
  const base = init?.headers || {};
  return CURRENT_TOKEN
    ? { ...base, Authorization: `Bearer ${CURRENT_TOKEN}` }
    : base;
}

export async function apiGet(path, init) {
  const url = join(ORIGIN, path);
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { ...(init || {}), method: "GET", signal: ctrl.signal, headers: withAuthHeaders(init) });
    const text = await res.text();
    if (__DEV__) console.log("GET", url, "->", res.status, text);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text}`);
    try { return JSON.parse(text); } catch { return text; }
  } finally { clearTimeout(to); }
}

export async function apiPost(path, body, init) {
  const url = join(ORIGIN, path);
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      ...(init || {}),
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...withAuthHeaders(init) },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const text = await res.text();
    if (__DEV__) console.log("POST", url, "->", res.status, text);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text}`);
    try { return JSON.parse(text); } catch { return text; }
  } finally { clearTimeout(to); }
}

export const API_BASE_DEBUG = ORIGIN;

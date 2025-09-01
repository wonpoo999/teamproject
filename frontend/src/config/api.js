import { Platform, NativeModules } from 'react-native';


function getMetroHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    try {
      const u = new URL(scriptURL);
      return u.hostname;
    } catch (e) { }
  }
  return undefined;
}


function getDevBase() {
  if (Platform.OS === 'android') {
    const host = getMetroHost();
    if (host && host !== 'localhost') {
      return `http://${host}:8080/api`;
    }
    return 'http://10.0.2.2:8080/api';
  }
  const host = getMetroHost() || 'localhost';
  return `http://${host}:8080/api`;
}

const DEFAULT_BASE = __DEV__ ? getDevBase() : 'https://your-prod.example.com/api';


const join = (base, path) =>
  `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;


export async function apiGet(path, init) {
  const url = join(DEFAULT_BASE, path);
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 8000);

  try {
    const res = await fetch(url, { ...(init || {}), method: 'GET', signal: ctrl.signal });
    const text = await res.text();
    if (__DEV__) console.log('GET', url, '->', res.status, text);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text}`);
    try { return JSON.parse(text); } catch (e) { return text; }
  } finally {
    clearTimeout(to);
  }
}

export async function apiPost(path, body, init) {
  const url = join(DEFAULT_BASE,path);
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);

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
    try { return JSON.parse(text); } catch (e) { return text; }
  } finally {
    clearTimeout(to);
  }
}

export const API_BASE_DEBUG = DEFAULT_BASE;

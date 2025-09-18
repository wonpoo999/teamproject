// src/bgm/BgmContext.js
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av'; // expo-av 고정

const loginSrc = require('../../assets/bgm/login_bgm.mp3');
const menuSrc  = require('../../assets/bgm/menu_bgm.mp3');

const Ctx = createContext(null);
export const useBgm = () => useContext(Ctx);

export function BgmProvider({ children }) {
  const [enabled, setEnabled] = useState(true);
  const [volume,  setVolume]  = useState(0.5);
  const [hydrated, setHydrated] = useState(false); // ✅ 저장값 로딩 완료 전엔 아무 것도 재생 안 함

  const soundRef      = useRef(null);
  const currentTagRef = useRef(null);   // 'login' | 'menu' | null
  const desiredTagRef = useRef('menu');
  const busyRef       = useRef(false);
  const reqIdRef      = useRef(0);

  // 모드 + 저장값 로딩
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('[BGM] setAudioMode error:', e?.message || e);
      }
      try {
        const [on, vol] = await Promise.all([
          AsyncStorage.getItem('@bgm/enabled'),
          AsyncStorage.getItem('@bgm/volume'),
        ]);
        if (on != null) setEnabled(on === '1');
        if (vol != null) setVolume(Math.min(1, Math.max(0, Number(vol))));
      } catch {}
      setHydrated(true);
    })();
  }, []);

  // 퍼시스트
  useEffect(() => { AsyncStorage.setItem('@bgm/enabled', enabled ? '1' : '0').catch(()=>{}); }, [enabled]);
  useEffect(() => { AsyncStorage.setItem('@bgm/volume',  String(volume)).catch(()=>{});     }, [volume]);

  // 실시간 볼륨 반영
  useEffect(() => {
    const s = soundRef.current;
    if (s) s.setStatusAsync?.({ volume: Number(volume) }).catch(()=>{});
  }, [volume]);

  async function hardStop() {
    const s = soundRef.current;
    soundRef.current = null;
    currentTagRef.current = null;
    if (!s) return;
    try { await s.stopAsync?.(); } catch {}
    try { await s.unloadAsync?.(); } catch {}
  }

  async function switchTo(tag) {
    desiredTagRef.current = tag;
    if (!hydrated) return;            // ✅ 저장값 로딩 전엔 재생 금지
    if (!enabled) { await hardStop(); return; }  // ✅ 꺼져있으면 절대 재생 않음
    if (currentTagRef.current === tag && soundRef.current) return;

    const myId = ++reqIdRef.current;
    if (busyRef.current) {
      setTimeout(() => { if (reqIdRef.current === myId) switchTo(tag); }, 0);
      return;
    }
    busyRef.current = true;
    try {
      await hardStop();
      const src = tag === 'login' ? loginSrc : menuSrc;
      const { sound } = await Audio.Sound.createAsync(src, { isLooping: true, volume: Number(volume) });
      if (reqIdRef.current !== myId) { try { await sound.stopAsync(); } catch {}; try { await sound.unloadAsync(); } catch {}; return; }
      soundRef.current = sound;
      currentTagRef.current = tag;
      await sound.playAsync();
    } catch (e) {
      console.warn('[BGM] play error:', e?.message || e);
    } finally {
      busyRef.current = false;
    }
  }

  // 토글 ON/OFF 즉시 반응 (OFF -> 정지, ON -> 현재 원하는 트랙만 1개)
  useEffect(() => {
    (async () => {
      if (!hydrated) return;
      if (!enabled) await hardStop();
      else          await switchTo(desiredTagRef.current || 'menu');
    })();
  }, [enabled, hydrated]);

  const loginRoutes = useMemo(() => new Set(['Welcome','Login','Signup','RecoveryFlow','RecoverySetup','FindId','ResetPw']), []);

  function applyRoute(routeName) {
    const tag = loginRoutes.has(routeName) ? 'login' : 'menu';
    desiredTagRef.current = tag;
    // 🚫 enabled=false 이면 자동 재생하지 않음
    if (enabled && hydrated) switchTo(tag);
    else if (!enabled) hardStop();
  }

  // 외부 제어
  async function play(tag = (desiredTagRef.current || 'menu')) { setEnabled(true); await switchTo(tag); }
  async function pause() { await hardStop(); }
  async function resume() { if (enabled) await switchTo(desiredTagRef.current || 'menu'); }
  async function stop() { await hardStop(); }

  useEffect(() => () => { hardStop(); }, []);

  return (
    <Ctx.Provider value={{ enabled, setEnabled, volume, setVolume, applyRoute, play, pause, resume, stop }}>
      {children}
    </Ctx.Provider>
  );
}

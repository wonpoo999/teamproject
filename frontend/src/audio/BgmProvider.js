// src/bgm/BgmProvider.js
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const K_ENABLED = '@bgm/enabled';
const K_VOLUME  = '@bgm/volume';

const loginSrc = require('../../assets/bgm/login_bgm.mp3');
const menuSrc  = require('../../assets/bgm/menu_bgm.mp3');

const loginRoutes = new Set(['Welcome', 'Login', 'Signup']);

const Ctx = createContext(null);

async function safeSetAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
}

export function BgmProvider({ children }) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume]   = useState(0.8);
  const [currentKey, setCurrentKey] = useState('login'); // 'login' | 'menu'
  const soundRef = useRef(null);
  const duckingRef = useRef(false);
  const lastVolRef = useRef(0.8);

  // 초기화
  useEffect(() => {
    (async () => {
      try {
        const en = await AsyncStorage.getItem(K_ENABLED);
        const vo = await AsyncStorage.getItem(K_VOLUME);
        if (en != null) setEnabled(en === '1');
        if (vo != null) {
          const v = Math.max(0, Math.min(1, Number(vo)));
          setVolume(Number.isFinite(v) ? v : 0.8);
          lastVolRef.current = Number.isFinite(v) ? v : 0.8;
        }
      } catch {}
      await safeSetAudioMode();
      if (enabled) await playKey(currentKey);
    })();
    return () => { unload(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 볼륨 반영
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(K_VOLUME, String(volume));
        lastVolRef.current = volume;
        if (soundRef.current) await soundRef.current.setStatusAsync({ volume });
      } catch {}
    })();
  }, [volume]);

  const unload = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(()=>{});
        await soundRef.current.unloadAsync().catch(()=>{});
        soundRef.current = null;
      }
    } catch {}
  }, []);

  const playKey = useCallback(async (key) => {
    if (!enabled) return;
    await safeSetAudioMode();
    await unload();

    const src = key === 'login' ? loginSrc : menuSrc;
    const { sound } = await Audio.Sound.createAsync(
      src,
      { volume: duckingRef.current ? Math.min(0.3, volume) : volume, isLooping: true, shouldPlay: true }
    );
    soundRef.current = sound;
  }, [enabled, unload, volume]);

  const setEnabledAsync = useCallback(async (v) => {
    setEnabled(v);
    try { await AsyncStorage.setItem(K_ENABLED, v ? '1' : '0'); } catch {}
    if (!v) await unload();
    else await playKey(currentKey);
  }, [currentKey, playKey, unload]);

  const applyRoute = useCallback(async (routeName = '') => {
    const next = loginRoutes.has(String(routeName)) ? 'login' : 'menu';
    setCurrentKey(next);
    if (!enabled) return;
    await playKey(next);
  }, [enabled, playKey]);

  // TTS/효과음 덕킹
  const duck = useCallback(async (on) => {
    duckingRef.current = !!on;
    if (soundRef.current) {
      const v = on ? Math.min(0.3, lastVolRef.current) : lastVolRef.current;
      try { await soundRef.current.setStatusAsync({ volume: v }); } catch {}
    }
  }, []);

  const value = useMemo(() => ({
    enabled, volume,
    setEnabled: setEnabledAsync,
    setVolume,
    applyRoute,
    duck,
  }), [enabled, volume, setEnabledAsync, applyRoute, duck]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBgm() {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  // 안전 no-op
  return {
    enabled: false, volume: 0,
    setEnabled: async () => {},
    setVolume: () => {},
    applyRoute: async () => {},
    duck: async () => {},
  };
}

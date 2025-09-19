// src/bgm/BgmContext.js
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const K_ENABLED = '@bgm/enabled';
const K_VOLUME  = '@bgm/volume';

const loginSrc = require('../../assets/bgm/login_bgm.mp3');
const menuSrc  = require('../../assets/bgm/menu_bgm.mp3');

// 로그인군 라우트는 로그인 BGM, 나머지는 메뉴 BGM
const LOGIN_ROUTES = new Set([
  'Welcome','Login','Signup','RecoveryFlow','RecoverySetup','SecurityQnaManager'
]);

const Ctx = createContext(null);

async function setAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
}

export function BgmProvider({ children }) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume]   = useState(0.8);

  const soundRef     = useRef(null);
  const currentKey   = useRef(null); // 'login' | 'menu'
  const duckingRef   = useRef(false);
  const lastVolRef   = useRef(0.8);
  const loadingRef   = useRef(false);

  // 초기화: 저장된 설정 불러오고 첫 사운드 준비(필요 시)
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
      await setAudioMode();
    })();
    return () => { unload(); };
  }, []);

  // 볼륨 반영/저장
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(K_VOLUME, String(volume));
        lastVolRef.current = volume;
        if (soundRef.current) await soundRef.current.setStatusAsync({ volume: duckingRef.current ? Math.min(0.3, volume) : volume });
      } catch {}
    })();
  }, [volume]);

  const unload = useCallback(async () => {
    try {
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); } catch {}
        try { await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }
    } catch {}
  }, []);

  const _play = useCallback(async (key) => {
    if (!enabled || loadingRef.current) return;
    loadingRef.current = true;
    try {
      await setAudioMode();
      // 같은 키면 재생상태/볼륨만 갱신
      if (currentKey.current === key && soundRef.current) {
        await soundRef.current.setStatusAsync({
          volume: duckingRef.current ? Math.min(0.3, lastVolRef.current) : lastVolRef.current,
          isLooping: true,
          shouldPlay: true,
        });
        return;
      }

      // 다른 트랙으로 전환
      await unload();
      const src = key === 'login' ? loginSrc : menuSrc;
      const { sound } = await Audio.Sound.createAsync(
        src,
        {
          volume: duckingRef.current ? Math.min(0.3, lastVolRef.current) : lastVolRef.current,
          isLooping: true,
          shouldPlay: true,
        }
      );
      soundRef.current = sound;
      currentKey.current = key;
    } finally {
      loadingRef.current = false;
    }
  }, [enabled, unload]);

  const setEnabledPersist = useCallback(async (v) => {
    setEnabled(v);
    try { await AsyncStorage.setItem(K_ENABLED, v ? '1' : '0'); } catch {}
    if (!v) await unload();
    else if (currentKey.current) await _play(currentKey.current);
  }, [_play, unload]);

  const applyRoute = useCallback(async (routeName='') => {
    const next = LOGIN_ROUTES.has(String(routeName)) ? 'login' : 'menu';
    if (!enabled) { currentKey.current = next; return; }
    await _play(next);
  }, [enabled, _play]);

  const duck = useCallback(async (on) => {
    duckingRef.current = !!on;
    if (soundRef.current) {
      try {
        await soundRef.current.setStatusAsync({
          volume: on ? Math.min(0.3, lastVolRef.current) : lastVolRef.current,
        });
      } catch {}
    }
  }, []);

  const value = useMemo(() => ({
    enabled,
    volume,
    setEnabled: setEnabledPersist,
    setVolume,
    applyRoute,
    duck,
  }), [enabled, volume, setEnabledPersist, applyRoute, duck]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBgm() {
  return useContext(Ctx) ?? {
    enabled:false, volume:0,
    setEnabled: async()=>{}, setVolume:()=>{},
    applyRoute: async()=>{}, duck: async()=>{},
  };
}

// src/screens/VoicePickerScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ImageBackground, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../i18n/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../theme/ThemeContext';
import { useBgm } from '../bgm/BgmContext';

const STORE_KEY = '@tts/voiceId';
const K_UNSUPPORTED = '@tts/unsupportedIds';
const FONT = 'DungGeunMo';

function langLabel(language='') {
  const ln = language.toLowerCase();
  if (ln.startsWith('ko')) return '한국어';
  if (ln.startsWith('en')) return 'English';
  if (ln.startsWith('ja')) return '日本語';
  if (ln.startsWith('zh')) return '中文';
  return '기타';
}
const PRIMARY_TABS = ['ko','en','ja','zh','other'];

export default function VoicePickerScreen() {
  const { t } = useI18n();
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const bgm = useBgm();

  const [voicesAll, setVoicesAll] = useState([]);
  const [voices, setVoices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ko');
  const [unsupported, setUnsupported] = useState(new Set());

  const bg = isDark ? require('../../assets/background/home_dark.png') : require('../../assets/background/home.png');

  // 불러오기
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORE_KEY);
      setSelectedId(saved || null);

      // unsupported DB
      let us = [];
      try { us = JSON.parse((await AsyncStorage.getItem(K_UNSUPPORTED)) || '[]'); } catch {}
      const usSet = new Set(us || []);
      setUnsupported(usSet);

      const list = (await Speech.getAvailableVoicesAsync()) || [];

      // (language+name) 중복 제거
      const uniq = [];
      const seen = new Set();
      for (const v of list) {
        const key = `${(v.language||'').toLowerCase()}|${(v.name||'').toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(v);
      }

      setVoicesAll(uniq);
      setLoading(false);
    })();
  }, []);

  // 탭 필터링 + unsupported 제거
  useEffect(() => {
    const filtered = voicesAll.filter(v => !unsupported.has(v.identifier));
    const out = filtered.filter(v => {
      const l = (v.language || '').toLowerCase();
      if (tab === 'ko') return l.startsWith('ko');
      if (tab === 'en') return l.startsWith('en');
      if (tab === 'ja') return l.startsWith('ja');
      if (tab === 'zh') return l.startsWith('zh');
      return !(l.startsWith('ko') || l.startsWith('en') || l.startsWith('ja') || l.startsWith('zh')); // other
    });
    setVoices(out.sort((a,b)=> (a.name||'').localeCompare(b.name||'')));
  }, [voicesAll, tab, unsupported]);

  function sampleText(language = '') {
    const ln = (language || '').toLowerCase();
    if (ln.startsWith('en')) return 'Hello, this is a longer sample voice for preview.';
    if (ln.startsWith('ja')) return 'こんにちは、これはプレビュー用の少し長めのサンプル音声です。';
    if (ln.startsWith('zh')) return '你好，这是用于预览的稍长一些的示例语音。';
    return '안녕하세요, 이것은 미리듣기를 위한 조금 더 긴 샘플 음성입니다.';
  }

  // 미반응/1초 미만 자동 배제 로직
  async function preview(item) {
    Speech.stop();
    const text = sampleText(item.language);
    let started = false;
    let t0 = 0;

    const stopDuck = () => { try { bgm.duck(false); } catch {} };

    const timeout = setTimeout(async () => {
      if (!started) {
        // onStart가 안 왔으면 미지원으로 판단 → 배제
        await markUnsupported(item.identifier);
        stopDuck();
        Alert.alert('안내', '해당 보이스는 이 기기에서 사용할 수 없어요. 목록에서 숨겼습니다.');
      }
    }, 1800);

    try { await bgm.duck(true); } catch {}

    Speech.speak(text, {
      language: (item.language || 'ko-KR'),
      voice: item.identifier,
      rate: 1.0,
      pitch: 1.0,
      onStart: () => { started = true; t0 = Date.now(); },
      onDone: async () => {
        clearTimeout(timeout);
        stopDuck();
        const dur = Date.now() - t0;
        if (!started || dur < 1000) {
          await markUnsupported(item.identifier);
          Alert.alert('안내', '해당 보이스는 재생 길이가 너무 짧거나 정상 동작하지 않아 숨겼습니다.');
        }
      },
      onStopped: () => { clearTimeout(timeout); stopDuck(); },
      onError: async () => {
        clearTimeout(timeout);
        stopDuck();
        await markUnsupported(item.identifier);
        Alert.alert('안내', '해당 보이스는 이 기기에서 사용할 수 없어요. 목록에서 숨겼습니다.');
      },
    });
  }

  async function markUnsupported(id) {
    if (!id) return;
    setUnsupported(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev); next.add(id);
      AsyncStorage.setItem(K_UNSUPPORTED, JSON.stringify(Array.from(next))).catch(()=>{});
      return next;
    });
    // 화면에서도 바로 제거
    setVoices(prev => prev.filter(v => v.identifier !== id));
  }

  async function save(item) {
    setSelectedId(item?.identifier || null);
    if (item?.identifier) await AsyncStorage.setItem(STORE_KEY, item.identifier);
    else await AsyncStorage.removeItem(STORE_KEY);
  }

  const TabBtn = ({ code, label }) => {
    const on = tab === code;
    return (
      <TouchableOpacity onPress={()=>setTab(code)}
        style={[S.filterBtn, { borderColor: theme.cardBorder, backgroundColor: on ? theme.primary : theme.ghostBg }]}>
        <Text style={[S.filterTxt, { color: on ? '#fff' : theme.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const TitleBar = () => (
    <View style={{ alignItems: 'center', paddingTop: insets.top + 16, marginBottom: 8 }}>
      <Text style={{ fontFamily: FONT, fontSize: 24, color: theme.text }}>
        {(t('VOICE_PICK') || '보이스 선택').replace(/_/g, ' ')}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const isSel = selectedId === item.identifier;
    const ll = langLabel(item.language || '');

    return (
      <View style={[S.row, { backgroundColor: theme.cardBg, borderColor: isSel ? '#10b981' : theme.cardBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[S.name, { color: theme.text }]} numberOfLines={1}>{item.name || '(no name)'} · {ll}</Text>
          <Text style={[S.meta, { color: theme.mutedText }]} numberOfLines={1}>{item.identifier}</Text>
        </View>
        <TouchableOpacity style={[S.btn, { backgroundColor: theme.ghostBg, borderColor: theme.inputBorder }]} onPress={() => preview(item)}>
          <Text style={[S.btnTxt, { color: theme.text }]}>{t('PREVIEW') || '미리듣기'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.btn, { backgroundColor: isSel ? '#10b981' : theme.primary, borderColor: 'transparent' }]} onPress={() => save(item)}>
          <Text style={[S.btnTxt, { color: '#fff' }]}>{isSel ? (t('SELECTED') || '선택됨') : (t('SELECT') || '선택')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground source={bg} style={{ flex: 1 }} resizeMode="cover">
      <View style={S.wrap}>
        <TitleBar />
        <View style={{ flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:10, flexWrap:'wrap' }}>
          <TabBtn code="ko" label="한국어" />
          <TabBtn code="en" label="English" />
          <TabBtn code="ja" label="日本語" />
          <TabBtn code="zh" label="中文" />
          <TabBtn code="other" label="기타" />
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <TouchableOpacity style={[S.btnWide, { backgroundColor: theme.primary }]} onPress={() => save({})}>
            <Text style={[S.btnTxt, { color: '#fff' }]}>{t('USE_DEFAULT_VOICE') || '기본 보이스 사용'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={[S.meta, { color: theme.text, paddingHorizontal: 16 }]}>{t('LOADING') || '로딩 중…'}</Text>
        ) : (
          <FlatList
            data={voices}
            keyExtractor={(item, idx) => item.identifier || String(idx)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const S = StyleSheet.create({
  wrap: { flex: 1 },
  filterBtn: { paddingHorizontal: 12, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterTxt: { fontFamily: FONT, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  name: { fontFamily: FONT, fontWeight: '800' },
  meta: { fontFamily: FONT, fontSize: 12 },
  btn: { paddingHorizontal: 12, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnTxt: { fontFamily: FONT, fontWeight: '700' },
  btnWide: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

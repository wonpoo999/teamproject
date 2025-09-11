// src/screens/VoicePickerScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ImageBackground } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../i18n/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../theme/ThemeContext';

const STORE_KEY = '@tts/voiceId';
const FONT = 'DungGeunMo';

export default function VoicePickerScreen() {
  const { t } = useI18n();
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [voices, setVoices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const bg = isDark
    ? require('../../assets/background/home_dark.png')
    : require('../../assets/background/home.png');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORE_KEY);
      setSelectedId(saved || null);
      const vs = await Speech.getAvailableVoicesAsync();
      setVoices(vs || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const list = tab === 'all' ? voices : voices.filter(v => (v.language || '').toLowerCase().startsWith(tab));
    return list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [voices, tab]);

  function sampleTextFor(language = '') {
    const ln = (language || '').toLowerCase();
    if (ln.startsWith('en')) return 'Hello, this is a sample voice.';
    if (ln.startsWith('ja')) return 'こんにちは、サンプルボイスです。';
    if (ln.startsWith('zh')) return '你好，这是示例语音。';
    return '안녕하세요. 테스트 음성입니다.';
  }

  async function preview(item) {
    Speech.stop();
    Speech.speak(sampleTextFor(item.language), {
      language: (item.language || 'ko-KR'),
      voice: item.identifier,
      rate: 1.0, pitch: 1.0,
    });
  }

  async function save(item) {
    setSelectedId(item?.identifier || null);
    if (item?.identifier) await AsyncStorage.setItem(STORE_KEY, item.identifier);
    else await AsyncStorage.removeItem(STORE_KEY);
  }

  const FilterBtn = ({ k, label }) => {
    const on = tab === k;
    return (
      <TouchableOpacity
        onPress={() => setTab(k)}
        style={[
          S.filterBtn,
          { borderColor: theme.cardBorder, backgroundColor: on ? theme.primary : theme.ghostBg },
        ]}
      >
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
    const langLabel =
      (item.language || '').toLowerCase().startsWith('ko') ? '한국어' :
      (item.language || '').toLowerCase().startsWith('en') ? 'English' :
      (item.language || '').toLowerCase().startsWith('ja') ? '日本語' :
      (item.language || '').toLowerCase().startsWith('zh') ? '中文' : (item.language || '').toUpperCase();

    return (
      <View style={[S.row, { backgroundColor: theme.cardBg, borderColor: isSel ? '#10b981' : theme.cardBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[S.name, { color: theme.text }]} numberOfLines={1}>{item.name || '(no name)'} · {langLabel}</Text>
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
      {/* 헤더 토글만 사용 — 화면 내 토글 제거 */}
      <View style={S.wrap}>
        <TitleBar />

        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 }}>
          <FilterBtn k="ko" label="한국어" />
          <FilterBtn k="en" label="English" />
          <FilterBtn k="ja" label="日本語" />
          <FilterBtn k="zh" label="中文" />
          <FilterBtn k="all" label={t('ALL') || '전체'} />
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
            data={filtered}
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

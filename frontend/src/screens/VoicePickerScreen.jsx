// src/screens/VoicePickerScreen.js
import { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../i18n/I18nContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../theme/ThemeContext';
import DarkModeButton from '../components/DarkModeButton';

const STORE_KEY = '@tts/voiceId';

export default function VoicePickerScreen() {
  const { t } = useI18n();
  const { colors } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [voices, setVoices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

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

  const TabBtn = ({ k, label }) => (
    <TouchableOpacity
      onPress={() => setTab(k)}
      style={[S.tabBtn, { borderColor: colors.cardBorder, backgroundColor: tab === k ? colors.chipOn : colors.chipOff }]}
    >
      <Text style={[S.tabTxt, { color: tab === k ? colors.chipOnText : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const isSel = selectedId === item.identifier;
    const langLabel =
      (item.language || '').toLowerCase().startsWith('ko') ? '한국어' :
      (item.language || '').toLowerCase().startsWith('en') ? 'English' :
      (item.language || '').toLowerCase().startsWith('ja') ? '日本語' :
      (item.language || '').toLowerCase().startsWith('zh') ? '中文' : (item.language || '').toUpperCase();

    return (
      <View style={[S.row, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, isSel && { borderColor: '#10b981' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[S.name, { color: colors.text }]}>{item.name || '(no name)'} · {langLabel}</Text>
          <Text style={[S.meta, { color: colors.mutedText }]}>{item.identifier}</Text>
        </View>
        <TouchableOpacity style={[S.btn, { backgroundColor: '#334155' }]} onPress={() => preview(item)}>
          <Text style={S.btnTxt}>{t('PREVIEW')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.btn, isSel ? { backgroundColor: '#10b981' } : { backgroundColor: '#334155' }]} onPress={() => save(item)}>
          <Text style={S.btnTxt}>{isSel ? t('SELECTED') : t('SELECT')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[S.wrap, { paddingTop: insets.top + 56, backgroundColor: colors.bg }]}>
      <DarkModeButton />
      <Text style={[S.title, { color: colors.text }]}> {t('VOICE_PICK')} </Text>

      <View style={S.tabs}>
        <TabBtn k="ko" label="한국어" />
        <TabBtn k="en" label="English" />
        <TabBtn k="ja" label="日本語" />
        <TabBtn k="zh" label="中文" />
        <TabBtn k="all" label={t('ALL')} />
      </View>

      <View style={S.actions}>
        <TouchableOpacity style={[S.btnWide, { backgroundColor: '#334155' }]} onPress={() => save({})}>
          <Text style={S.btnTxt}>{t('USE_DEFAULT_VOICE')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={[S.meta, { color: colors.text }]}>{t('LOADING')}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => item.identifier || String(idx)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  wrap:{ flex:1, paddingHorizontal:16 },
  title:{ fontSize:22, fontWeight:'900', marginBottom:12, fontFamily:'DungGeunMo' },
  tabs:{ flexDirection:'row', gap:8, marginBottom:12 },
  tabBtn:{ paddingHorizontal:12, paddingVertical:8, borderRadius:10, borderWidth:1 },
  tabTxt:{ fontWeight:'700', fontFamily:'DungGeunMo' },
  actions:{ flexDirection:'row', gap:10, marginBottom:12 },
  row:{ flexDirection:'row', alignItems:'center', gap:10, padding:12, borderRadius:12, borderWidth:1 },
  name:{ fontWeight:'800', fontFamily:'DungGeunMo' },
  meta:{ fontSize:12, fontFamily:'DungGeunMo' },
  btn:{ paddingHorizontal:12, paddingVertical:8, borderRadius:10 },
  btnTxt:{ color:'#fff', fontWeight:'700', fontFamily:'DungGeunMo' },
  btnWide:{ flex:1, paddingVertical:10, borderRadius:10, alignItems:'center' },
});

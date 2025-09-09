// src/screens/SettingsScreen.js
import { View, ScrollView, TouchableOpacity, Text, Switch, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode } from '../theme/ThemeContext';
import DarkModeButton from '../components/DarkModeButton';

const FONT = 'DungGeunMo';
const VOICE_KEY = '@tts/voiceId';
const BG_LIGHT = require('../../assets/background/home.png');
const BG_DARK  = require('../../assets/background/home_dark.png'); // 없는 경우 하나 추가

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useI18n();
  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') });
  const { colors, isDark } = useThemeMode();

  const [sfx, setSfx] = useState(true);
  const [voiceId, setVoiceId] = useState(null);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem('@settings/sfx');
      if (v != null) setSfx(v === '1');
      const vid = await AsyncStorage.getItem(VOICE_KEY);
      setVoiceId(vid);
    })();
  }, []);

  const toggleSfx = async () => {
    const next = !sfx; setSfx(next);
    try { await AsyncStorage.setItem('@settings/sfx', next ? '1' : '0'); } catch {}
  };

  const goVoice = () => {
    const names = navigation.getState()?.routeNames || [];
    if (names.includes('VoicePicker')) navigation.navigate('VoicePicker');
    else navigation.getParent()?.navigate?.('VoicePicker');
  };

  const LangBtn = ({ k, label }) => (
    <TouchableOpacity
      onPress={() => setLang(k)}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
        borderColor: lang === k ? colors.primary : colors.cardBorder,
        backgroundColor: lang === k ? colors.chipOn : colors.chipOff
      }}
    >
      <Text style={{
        fontFamily: fontsLoaded ? FONT : undefined,
        color: lang === k ? colors.chipOnText : colors.chipOffText,
        fontSize: 16, lineHeight: 20, includeFontPadding: true
      }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground source={isDark ? BG_DARK : BG_LIGHT} style={{ flex: 1 }}>
      <DarkModeButton />
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
        <Text style={{
          fontSize: 28, textAlign: 'center', marginBottom: 16,
          fontFamily: fontsLoaded ? FONT : undefined, lineHeight: 34, includeFontPadding: true,
          color: colors.text
        }}>SETTING</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
        <View style={{ flex: 1, backgroundColor: colors.cardBg, borderRadius: 16, padding: 20, borderWidth:1, borderColor: colors.cardBorder }}>
          <ScrollView contentContainerStyle={{ rowGap: 20 }}>
            <View style={{ gap: 10 }}>
              <Text style={{ fontFamily: fontsLoaded ? FONT : undefined, fontSize: 18, lineHeight: 22, color: colors.text }}>
                {t('LANGUAGE')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <LangBtn k="ko" label="한국어" />
                <LangBtn k="en" label="English" />
                <LangBtn k="ja" label="日本語" />
                <LangBtn k="zh" label="中文" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontFamily: fontsLoaded ? FONT : undefined, marginRight: 8, fontSize: 16, lineHeight: 20, color: colors.text }}>
                {t('SOUND')}
              </Text>
              <Switch value={sfx} onValueChange={toggleSfx} />
              <Text style={{ fontFamily: fontsLoaded ? FONT : undefined, marginLeft: 8, fontSize: 16, lineHeight: 20, color: colors.text }}>
                {sfx ? t('ON') : t('OFF')}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: fontsLoaded ? FONT : undefined, fontSize: 18, lineHeight: 22, color: colors.text }}>
                {t('VOICE')}
              </Text>
              <TouchableOpacity onPress={goVoice}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center'
                }}
              >
                <Text style={{ fontFamily: fontsLoaded ? FONT : undefined, color: '#fff', fontSize: 16, lineHeight: 20 }}>
                  {t('VOICE_PICK')}
                </Text>
                <Text style={{ fontFamily: fontsLoaded ? FONT : undefined, color: '#d1d5db', fontSize: 12, lineHeight: 16, marginTop: 4 }}>
                  {voiceId ? `${t('CURRENT')}: ${voiceId}` : `${t('CURRENT')}: ${t('DEFAULT_VOICE')}`}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={logout}
              style={{ backgroundColor: '#ef4444', padding: 14, borderRadius: 10, marginTop: 40 }}
            >
              <Text style={{ fontFamily: fontsLoaded ? FONT : undefined, color: '#fff', textAlign: 'center', fontSize: 18, lineHeight: 22 }}>
                {t('LOGOUT')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </ImageBackground>
  );
}

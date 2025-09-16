import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFonts } from 'expo-font';
import { useI18n } from '../i18n/I18nContext';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FONT = 'DungGeunMo';

const langFix = (lang) => ({
  // 입력 필드만 언어별 패딩 보정
  input: {
    paddingVertical: 16,
    minHeight: 50,
    lineHeight: 22,
    includeFontPadding: false,
    ...(lang === 'ja' || lang === 'zh' ? { paddingTop: 18, paddingBottom: 14 } : {}),
  },
});

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t, lang, setLang } = useI18n();
  const { isDark, theme } = useThemeMode();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') });
  if (!fontsLoaded) return null;

  const fix = langFix(lang);

  const normalizeLoginError = (raw) => {
    if (raw && typeof raw === 'object') {
      const status = raw.status ?? raw.code;
      const msg = String(raw.message ?? raw.error ?? '');
      if (status === 401 || /unauthorized|401/i.test(msg)) return t('ERR_WRONG_PW');
      if (status === 404) return t('ERR_NO_USER');
      if (status === 403) return t('ERR_FORBIDDEN');
      if (/password/i.test(msg)) return t('ERR_WRONG_PW');
      if (/user.*not.*found|no.*user|unknown.*user/i.test(msg)) return t('ERR_NO_USER');
      if (/invalid.*credential|wrong.*credential/i.test(msg)) return t('ERR_INVALID_CRED');
      if (msg) return msg;
    }
    if (typeof raw === 'string') {
      if (/password/i.test(raw)) return t('ERR_WRONG_PW');
      if (/user.*not.*found|no.*user|unknown.*user/i.test(raw)) return t('ERR_NO_USER');
      if (/unauthorized|401/i.test(raw)) return t('ERR_WRONG_PW');
      return raw;
    }
    return t('ERR_INVALID_CRED');
  };

  const onSubmit = async () => {
    if (loading) return;
    if (!id || !password) {
      Alert.alert(t('INPUT_REQUIRED'), t('ENTER_ID_PW'));
      return;
    }
    try {
      setLoading(true);
      const res = await login(id.trim(), password);
      const ok = res === true || res === 'ok' || (res && typeof res === 'object' && (res.ok === true || res.success === true));
      if (!ok) {
        const errMsg = (res && typeof res === 'object' && (res.message || res.error)) || (typeof res === 'string' ? res : undefined);
        throw new Error(normalizeLoginError(errMsg));
      }
    } catch (e) {
      Alert.alert('LOGIN', normalizeLoginError(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontFamily: FONT,
    color: theme.text,
    backgroundColor: theme.inputBg,
    ...fix.input,
  };

  const LangBtn = ({ k, label }) => (
    <TouchableOpacity
      onPress={() => setLang(k)}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, marginBottom: 8,
        borderWidth: 1, borderColor: lang === k ? theme.chipOn : theme.cardBorder,
        backgroundColor: lang === k ? theme.chipOn : theme.chipOff,
      }}
    >
      <Text style={{ fontFamily: FONT, color: lang === k ? theme.chipOnText : theme.chipOffText }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1, justifyContent: 'center', paddingBottom: insets.bottom + 220, minHeight: 720 }}
      >
        {/* 언어 버튼 – 네이티브 표기 */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
          <LangBtn k="ko" label="한국어" />
          <LangBtn k="en" label="English" />
          <LangBtn k="ja" label="日本語" />
          <LangBtn k="zh" label="中文" />
        </View>

        {/* 제목: 밑둥 잘림 방지 (넉넉한 lineHeight + 살짝 하단 패딩) */}
        <Text
          style={{
            fontSize: 44,
            lineHeight: 56,          // 넉넉한 라인박스
            paddingBottom: 2,        // 글꼴 descender 보정
            textAlign: 'center',
            marginBottom: 16,
            fontFamily: FONT,
            color: theme.text,
          }}
        >
          {t('LOGIN')}
        </Text>

        <TextInput
          value={id}
          onChangeText={setId}
          placeholder={t('EMAIL_PH')}
          placeholderTextColor={isDark ? '#9ca3af' : '#9aa0a6'}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          style={inputStyle}
          returnKeyType="next"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('PW_PH')}
          placeholderTextColor={isDark ? '#9ca3af' : '#9aa0a6'}
          secureTextEntry
          textContentType="password"
          style={inputStyle}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          style={{ backgroundColor: loading ? '#93c5fd' : '#2563eb', padding: 14, borderRadius: 12, marginTop: 6 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontFamily: FONT }}>
            {loading ? '…' : t('LOGIN')}
          </Text>
        </TouchableOpacity>

        {/* 아이디/비번 찾기 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 14 }}>
          <TouchableOpacity onPress={() => navigation.navigate('RecoveryFlow', { mode: 'findId' })}>
            <Text style={{ fontFamily: FONT, color: '#60a5fa' }}>{t('FIND_ID')}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#64748b' }}>|</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RecoveryFlow', { mode: 'resetPw' })}>
            <Text style={{ fontFamily: FONT, color: '#60a5fa' }}>{t('PW_RECOVERY')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={{ alignItems: 'center', paddingTop: 6 }}>
          <Text style={{ fontFamily: FONT, color: '#10b981' }}>{t('GO_SIGNUP')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiPost, API_BASE_DEBUG } from '../config/api.js';
import { calcBMI, classifyBMI } from '../utils/bmi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';
import BgmFab from '../bgm/BgmFab';

const FONT = 'DungGeunMo';

const isValidEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
const langFix = (lang) => ({
  text: { includeFontPadding: true, paddingTop: 2, paddingBottom: 2 },
  input: { paddingVertical: 14, minHeight: 48, lineHeight: 22, ...(lang === 'ja' || lang === 'zh' ? { paddingTop: 16 } : {}) },
});

// 추가: (선택) 라벨
const OPTIONAL = { ko: '(선택)', en: '(optional)', ja: '（任意）', zh: '（可选）' };

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') });

  const { t, lang, setLang } = useI18n();
  const { theme } = useThemeMode();
  const fix = langFix(lang);

  let auth = null;
  try { auth = useAuth?.(); } catch { auth = null; }

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('F');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);

  // 접기/펼치기 스위치
  const [qnaOpen, setQnaOpen] = useState(false);

  const [qna, setQna] = useState([
    { code: 'BIRTHPLACE', labelKey: 'QUESTION_BIRTHPLACE', answer: '' },
    { code: 'CHILDHOOD_AREA', labelKey: 'QUESTION_CHILDHOOD_AREA', answer: '' },
    { code: 'PET_NAME', labelKey: 'QUESTION_PET_NAME', answer: '' },
    { code: 'MOTHER_NAME', labelKey: 'QUESTION_MOTHER_NAME', answer: '' },
    { code: 'ROLE_MODEL', labelKey: 'QUESTION_ROLE_MODEL', answer: '' },
  ]);
  const setQ = (idx, v) => setQna(arr => arr.map((x,i)=> i===idx ? ({...x, answer: v}) : x));

  const endpoint = useMemo(() => `${API_BASE_DEBUG}/api/auth/signup`, []);

  async function signupFallback(payload) {
    const res = await apiPost('/api/auth/signup', payload);
    return !!res;
  }

  const onSubmit = async () => {
    if (!id || !password || !weight || !age || !gender || !height) {
      return Alert.alert(t('INPUT_REQUIRED'), t('ENTER_ID_PW'));
    }
    if (!isValidEmail(id)) return Alert.alert(t('CONFIRM'), t('EMAIL_INVALID'));
    if (String(password).length < 8) return Alert.alert(t('CONFIRM'), t('PW_TOO_SHORT'));

    const payload = {
      id: id.trim(),
      password,
      weight: Number(weight),
      age: Number(age),
      gender,
      height: Number(height),
    };

    if (Number.isNaN(payload.age) || Number.isNaN(payload.weight) || Number.isNaN(payload.height)) {
      return Alert.alert(t('CONFIRM'), t('NUM_ONLY'));
    }

    try {
      setLoading(true);
      const ok = auth?.signup ? await auth.signup(payload) : await signupFallback(payload);
      if (ok) {
        await AsyncStorage.setItem('@profile/prefill', JSON.stringify({
          id: payload.id, email: payload.id, weight: payload.weight, height: payload.height, age: payload.age, gender: payload.gender,
        }));
        await AsyncStorage.setItem('last_user_id', payload.id);
        await AsyncStorage.setItem('goal_draft', JSON.stringify({
          weight: payload.weight, height: payload.height, age: payload.age, gender: payload.gender,
        }));
        const bmi = calcBMI(payload.weight, payload.height);
        await AsyncStorage.setItem('@avatar/category_prefill', String(classifyBMI(bmi)));

        const answers = qna
          .filter(x => (x.answer || '').trim().length > 0)
          .map(x => ({ code: x.code, answer: x.answer.trim() }));
        if (answers.length) { try { await apiPost('/api/recover/register', { answers }); } catch {} }

        Alert.alert(t('CONFIRM'), t('UPDATE_OK'));
        navigation.replace('Login');
      } else {
        Alert.alert(t('CONFIRM'), t('UPDATE_FAIL'));
      }
    } catch (e) {
      Alert.alert(t('CONFIRM'), e?.message ?? t('TRY_AGAIN'));
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const inputStyle = {
    borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10,
    paddingHorizontal: 12, fontFamily: FONT, color: theme.text, backgroundColor: theme.inputBg, ...fix.input,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <BgmFab align="right" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 140, paddingTop: insets.top + 80, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 언어 선택 */}
        <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'center', marginBottom: 6 }}>
          {[
            { k: 'ko', label: '한국어' },
            { k: 'en', label: 'English' },
            { k: 'ja', label: '日本語' },
            { k: 'zh', label: '中文' },
          ].map(item => (
            <TouchableOpacity
              key={item.k}
              onPress={() => setLang(item.k)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
                borderColor: lang === item.k ? theme.chipOn : theme.cardBorder,
                backgroundColor: lang === item.k ? theme.chipOn : theme.chipOff,
              }}
            >
              <Text style={{ fontFamily: FONT, color: lang === item.k ? theme.chipOnText : theme.chipOffText, ...fix.text }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 36, fontFamily: FONT, marginBottom: 20, textAlign: 'center', color: theme.text, ...fix.text }}>
          {(t('SIGN_UP') || 'SIGN UP').toUpperCase()}
        </Text>

        <TextInput value={id} onChangeText={setId} placeholder={t('EMAIL')} placeholderTextColor={theme.mutedText}
          autoCapitalize="none" keyboardType="email-address" inputMode="email" style={inputStyle}/>
        <TextInput value={password} onChangeText={setPassword} placeholder={t('PASSWORD_8')} placeholderTextColor={theme.mutedText}
          secureTextEntry autoCapitalize="none" style={inputStyle}/>
        <TextInput value={age} onChangeText={setAge} placeholder={t('AGE')} placeholderTextColor={theme.mutedText}
          keyboardType="numeric" style={inputStyle}/>

        {/* 성별 버튼 */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['F','M'].map(g => {
            const on = gender === g;
            const label = g === 'F' ? t('GENDER_FEMALE') : t('GENDER_MALE');
            return (
              <TouchableOpacity key={g} onPress={() => setGender(g)}
                style={{ flex: 1, backgroundColor: on ? theme.text : theme.inputBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.inputBorder }}>
                <Text style={{ fontFamily: FONT, color: on ? '#fff' : theme.text, textAlign: 'center', ...fix.text }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput value={weight} onChangeText={setWeight} placeholder={t('WEIGHT_KG')} placeholderTextColor={theme.mutedText}
          keyboardType="numeric" style={inputStyle}/>
        <TextInput value={height} onChangeText={setHeight} placeholder={t('HEIGHT_CM')} placeholderTextColor={theme.mutedText}
          keyboardType="numeric" style={inputStyle}/>

        {/* 보안 질문 (접기/펼치기) */}
        <View style={{ marginTop: 12, gap: 10 }}>
          <TouchableOpacity
            onPress={() => setQnaOpen(x=>!x)}
            style={{
              flexDirection:'row', alignItems:'center', justifyContent:'space-between',
              backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth:1, borderRadius:12, padding:12
            }}
          >
            <Text style={{ fontFamily: FONT, fontSize: 18, color: theme.text }}>
              {(t('SECURITY_QNA') || '보안 질문')} <Text style={{ color: theme.mutedText }}>{OPTIONAL[lang] || OPTIONAL.ko}</Text>
            </Text>
            <Text style={{ fontFamily: FONT, color: theme.mutedText }}>{qnaOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {qnaOpen && (
            <>
              <Text style={{ fontFamily: FONT, color: theme.mutedText }}>
                {t('SECURITY_DESC_SIGNUP')}
                {'\n'}
                {lang==='ko' && '비밀번호 복구: 최소 2문항 / 아이디 복구: 5문항 모두 필요 (5 미만이면 비밀번호만 복구 가능)'}
                {lang==='en' && 'Password recovery: at least 2 answers.  ID recovery: all 5 required (with <5, only password can be recovered).'}
                {lang==='ja' && 'パスワード復旧：2問以上。ID復旧：5問すべて必須（5未満はパスワードのみ）。'}
                {lang==='zh' && '找回密码：至少 2 个答案。找回ID：需 5 个全部（少于 5 个仅可找回密码）。'}
              </Text>

              {qna.map((row, idx) => (
                <View key={row.code} style={{ gap: 6 }}>
                  <Text style={{ fontFamily: FONT, color: theme.text, ...fix.text }}>{t(row.labelKey)}</Text>
                  <TextInput
                    value={row.answer}
                    onChangeText={(v)=>setQ(idx, v)}
                    placeholder={t('ANSWER')}
                    placeholderTextColor={theme.mutedText}
                    style={inputStyle}
                  />
                </View>
              ))}
            </>
          )}
        </View>

        <TouchableOpacity onPress={onSubmit} disabled={loading}
          style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 10, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontFamily: FONT }}>
            {loading ? '…' : (t('CREATE_ACCOUNT') || 'Create account')}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: theme.mutedText, fontFamily: FONT }}>{t('ALREADY_HAVE_ACCOUNT')}{' '}</Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={{ color: '#2563eb', fontFamily: FONT }}>{t('LOGIN')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

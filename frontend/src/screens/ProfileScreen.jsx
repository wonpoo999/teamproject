// src/screens/ProfileScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  View, Text, TextInput, Pressable, StyleSheet, ImageBackground,
  Modal, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ORIGIN } from '../config/api';
import { useFonts } from 'expo-font';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const FONT = 'DungGeunMo';

if (Text.defaultProps == null) Text.defaultProps = {};
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1;
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.maxFontSizeMultiplier = 1;

// ===== Utils =====
const todayKey = () => {
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
};

const fetchWithTimeout = (url, opts, ms = 8000) =>
  Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);

// 출석 + 코인 합산(오늘 코인 리셋/유지)
async function ensureDailyAttendance() {
  const K_FIRST='@att/first', K_LAST='@att/last', K_TOTAL='@att/total', K_STREAK='@att/streak';
  const K_COINS_TOTAL='@coins', K_COINS_TODAY='@coins/today';
  const today = todayKey();
  const [first,last,totalStr,streakStr,totalCoinsStr,todayCoinsStr]=await Promise.all([
    AsyncStorage.getItem(K_FIRST),
    AsyncStorage.getItem(K_LAST),
    AsyncStorage.getItem(K_TOTAL),
    AsyncStorage.getItem(K_STREAK),
    AsyncStorage.getItem(K_COINS_TOTAL),
    AsyncStorage.getItem(K_COINS_TODAY),
  ]);
  let firstDay = first || today;
  let lastDay = last || '';
  let total = Number(totalStr || 0);
  let streak = Number(streakStr || 0);
  const coinsTotal = Number(totalCoinsStr || 0);
  let coinsToday = Number(todayCoinsStr || 0);

  // 날짜 바뀌면 출석/연속 처리 + 오늘 코인 리셋
  if (lastDay !== today) {
    let isConsecutive = false;
    if (lastDay) {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      isConsecutive = y.toISOString().slice(0,10) === lastDay;
    }
    streak = isConsecutive ? Math.max(1, streak + 1) : 1;
    total = Math.max(1, total + 1);
    lastDay = today;
    coinsToday = 0; // 리셋
    await AsyncStorage.setItem(K_COINS_TODAY, '0');
  }

  await Promise.all([
    AsyncStorage.setItem(K_FIRST, firstDay),
    AsyncStorage.setItem(K_LAST, lastDay),
    AsyncStorage.setItem(K_TOTAL, String(total)),
    AsyncStorage.setItem(K_STREAK, String(streak)),
  ]);

  return { firstDay, totalDays: total, streak, coins: coinsTotal, todayCoins: coinsToday };
}

function Row({ k, v }) {
  const { theme } = useThemeMode();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontFamily: FONT, color: theme.mutedText }}>{k}</Text>
      <Text style={{ fontFamily: FONT, color: theme.text }}>{String(v ?? '-')}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useI18n();
  const { theme } = useThemeMode();
  const [fontsLoaded] = useFonts({ [FONT]: require('../../assets/fonts/DungGeunMo.otf') });
  useEffect(() => {
    if (fontsLoaded) {
      if (!Text.defaultProps.style) Text.defaultProps.style = { fontFamily: FONT, includeFontPadding: true };
      if (!TextInput.defaultProps.style) TextInput.defaultProps.style = { fontFamily: FONT };
    }
  }, [fontsLoaded]);

  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const userId = auth?.user?.id || null;
  const nav = useNavigation();
  const scRef = useRef(null);

  const [current, setCurrent] = useState({ id: '', weight: '', height: '', age: '', gender: '' });
  const [attendance, setAttendance] = useState({ firstDay: '-', totalDays: '-', streak: '-', coins: 0, todayCoins: 0 });

  const [editingAccount, setEditingAccount] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [form, setForm] = useState({
    weight: '', height: '', age: '', gender: '', targetWeight: '', targetCalories: '',
    newId: '', newPassword: '', confirmPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [errAccount, setErrAccount] = useState('');
  const [errProfile, setErrProfile] = useState('');
  const [okAccount, setOkAccount] = useState('');
  const [okProfile, setOkProfile] = useState('');
  const [getEndpoint, setGetEndpoint] = useState(null);
  const [pwModal, setPwModal] = useState(false);
  const [pwInput, setPwInput] = useState('');

  const getAuth = useCallback(async () => {
    const ctxType = auth?.tokenType || auth?.token_type || 'Bearer';
    try {
      const s = await SecureStore.getItemAsync('accessToken');
      if (s) {
        const m = String(s).match(/^(Bearer|Basic|Token)\s+(.+)$/i);
        return { token: m ? m[2] : s, type: m ? m[1] : 'Bearer' };
      }
    } catch {}
    const keys = ['token', 'authToken', '@auth/token'];
    for (const k of keys) {
      const v = await AsyncStorage.getItem(k);
      if (v) {
        const m = String(v).match(/^(Bearer|Basic|Token)\s+(.+)$/i);
        return { token: m ? m[2] : v, type: m ? m[1] : 'Bearer' };
      }
    }
    return { token: null, type: ctxType };
  }, [auth]);

  const logoutToWelcome = useCallback(async () => {
    try { await AsyncStorage.multiRemove(['token','authToken','accessToken','@auth/token','@profile/prefill']) } catch {}
    try { await auth?.logout?.() } catch {}
  }, [auth]);

  const fetchFirstOK = useCallback(
    async (method, paths, body) => {
      const { token, type } = await getAuth();
      let lastErr;
      for (const p of paths) {
        try {
          const res = await fetchWithTimeout(`${ORIGIN}${p}`, {
            method,
            headers: {
              Accept: 'application/json',
              ...(body ? { 'Content-Type': 'application/json' } : {}),
              ...(token ? { Authorization: `${type} ${token}` } : {}),
            },
            credentials: 'include',
            ...(body ? { body: JSON.stringify(body) } : {}),
          });
          if (res.ok) {
            const ttxt = await res.text();
            try { return { data: JSON.parse(ttxt), used: p }; } catch { return { data: null, used: p }; }
          }
          if (res.status === 401 || res.status === 403) {
            const ttxt = await res.text();
            throw new Error(ttxt || '401');
          }
          lastErr = new Error(await res.text());
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('요청 실패');
    },
    [getAuth]
  );

  const applyToState = useCallback((obj) => {
    const email = obj?.id ?? obj?.email ?? '';
    const weight = obj?.weight ?? '';
    const height = obj?.height ?? '';
    const age = obj?.age ?? '';
    const gender = obj?.gender ?? '';
    const targetWeight = obj?.targetWeight ?? '';
    const targetCalories = obj?.targetCalories ?? '';
    setCurrent({ id: email, weight, height, age, gender });
    setForm({
      weight: weight === '' ? '' : String(weight),
      height: height === '' ? '' : String(height),
      age: age === '' ? '' : String(age),
      gender: gender ?? '',
      targetWeight: targetWeight === '' ? '' : String(targetWeight),
      targetCalories: targetCalories === '' ? '' : String(targetCalories),
      newId: email ?? '',
      newPassword: '',
      confirmPassword: '',
    });

    const att = {
      firstDay: obj?.firstDay,
      totalDays: obj?.totalDays ?? obj?.attendanceTotal,
      streak: obj?.streak ?? obj?.currentStreak,
      coins: obj?.coins,
      todayCoins: obj?.todayCoins,
    };
    setAttendance(prev => ({ ...prev, ...Object.fromEntries(Object.entries(att).filter(([,v]) => v !== undefined)) }));
  }, []);

  const load = useCallback(async () => {
    setErrAccount(''); setErrProfile(''); setOkAccount(''); setOkProfile('');
    // 로컬 출석/코인 스냅샷
    const localAtt = await ensureDailyAttendance();
    setAttendance(a => ({ ...a, ...localAtt }));

    let showedPrefill = false;
    try {
      const raw = await AsyncStorage.getItem('@profile/prefill');
      if (raw) {
        const prefill = JSON.parse(raw);
        if (!prefill?.id || !userId || String(prefill.id) === String(userId)) {
          applyToState(prefill);
          setLoading(false);
          showedPrefill = true;
        } else {
          await AsyncStorage.removeItem('@profile/prefill');
        }
      }
    } catch {}
    try {
      const { data, used } = await fetchFirstOK('GET', ['/api/profile', '/api/profile/']);
      setGetEndpoint(used || '/api/profile');
      if (data) applyToState(data);
      setLoading(false);
      try { await AsyncStorage.removeItem('@profile/prefill'); } catch {}
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
        await logoutToWelcome();
        return;
      }
      if (!showedPrefill) {
        setErrProfile(t('TRY_LATER') || '나중에 다시 시도해 주세요.');
        setLoading(false);
      }
    }
  }, [applyToState, fetchFirstOK, logoutToWelcome, userId, t]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const saveAccount = async () => {
    setSavingAccount(true);
    setErrAccount(''); setOkAccount('');
    try {
      const nextId = (form.newId || current.id || '').trim();
      if (!nextId || !/^\S+@\S+\.\S+$/.test(nextId)) throw new Error(t('EMAIL_INVALID'));
      const changingPw = !!form.newPassword || !!form.confirmPassword;
      if (changingPw) {
        if ((form.newPassword || '').length < 8) throw new Error(t('PW_TOO_SHORT'));
        if (form.newPassword !== form.confirmPassword) throw new Error(t('PW_MISMATCH'));
      }
      const payload = { id: nextId, ...(changingPw ? { newPassword: form.newPassword } : {}) };
      const candidates = [getEndpoint, '/api/profile', '/api/profile/'].filter(Boolean);
      await fetchFirstOK('PUT', candidates, payload);
      setOkAccount(t('UPDATE_OK'));
      setEditingAccount(false);
      setCurrent(c => ({ ...c, id: nextId }));
      setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }));
      await AsyncStorage.removeItem('@profile/prefill');
      await load();
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
        await logoutToWelcome();
        return;
      }
      setErrAccount(e?.message || t('UPDATE_FAIL'));
    } finally { setSavingAccount(false); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setErrProfile(''); setOkProfile('');
    try {
      const numOk = v => v === '' || !Number.isNaN(Number(v));
      if (!numOk(form.weight) || !numOk(form.height) || !numOk(form.age) || !numOk(form.targetWeight) || !numOk(form.targetCalories)) {
        throw new Error(t('NUMERIC_ONLY'));
      }
      const payload = {
        id: (current.id || '').trim(),
        ...(form.weight !== '' ? { weight: Number(form.weight) } : {}),
        ...(form.height !== '' ? { height: Number(form.height) } : {}),
        ...(form.age !== '' ? { age: Number(form.age) } : {}),
        ...(form.gender ? { gender: form.gender } : {}),
        ...(form.targetWeight !== '' ? { targetWeight: Number(form.targetWeight) } : {}),
        ...(form.targetCalories !== '' ? { targetCalories: Number(form.targetCalories) } : {}),
      };
      const candidates = [getEndpoint, '/api/profile', '/api/profile/'].filter(Boolean);
      await fetchFirstOK('PUT', candidates, payload);
      setOkProfile(t('UPDATE_OK'));
      setEditingProfile(false);
      await AsyncStorage.removeItem('@profile/prefill');
      await load();
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
        await logoutToWelcome();
        return;
      }
      setErrProfile(e?.message || t('UPDATE_FAIL'));
    } finally { setSavingProfile(false); }
  };

  const openRecovery = () => setPwModal(true);
  const verifyPwAndGo = async () => {
    try {
      const res = await auth.login(current.id, pwInput);
      if (res === true || res === 'ok' || (res && typeof res === 'object' && (res.ok || res.success))) {
        setPwModal(false);
        setPwInput('');
        nav.navigate('RecoverySetup');
      } else throw new Error(t('ERR_WRONG_PW'));
    } catch {
      setPwInput('');
      alert(t('ERR_WRONG_PW'));
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: 'height' })} style={{ flex: 1 }}>
      <ImageBackground source={theme.homeBg} style={{ flex: 1 }} resizeMode="cover">
        <ThemeToggle align="right" />
        <Text style={[styles.screenTitle, { top: insets.top + 8, color: theme.text }]}>{t('PROFILE')}</Text>

        <ScrollView
          ref={scRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 108, paddingBottom: insets.bottom + 200 }]}
        >
          {/* Attendance */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('ATTENDANCE')}</Text>
            <Row k={t('FIRST_DAY')} v={attendance.firstDay} />
            <Row k={t('TOTAL_DAYS')} v={attendance.totalDays} />
            <Row k={t('CURRENT_STREAK')} v={attendance.streak} />
            <Row
              k={t('COINS')}
              v={`${attendance.coins ?? 0}${attendance.todayCoins > 0 ? ` (+${attendance.todayCoins})` : ''}`}
            />
          </View>

          {/* Account */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('ACCOUNT_INFO')}</Text>
            {!editingAccount ? (
              <>
                <View style={styles.rowBetween}>
                  <Text style={[styles.label, { color: theme.text }]}>{t('CURRENT_EMAIL')}</Text>
                  <Text style={[styles.value, { color: theme.text }]}>{current.id ? String(current.id) : '-'}</Text>
                </View>
                {!!errAccount && <Text style={[styles.error]}>{errAccount}</Text>}
                {!!okAccount && <Text style={[styles.ok]}>{okAccount}</Text>}
                <Pressable onPress={() => { setErrAccount(''); setOkAccount(''); setEditingAccount(true); }} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
                  <Text style={styles.primaryBtnText}>{t('EDIT')}</Text>
                </Pressable>

                <Pressable onPress={openRecovery} style={[styles.ghostBtn, { backgroundColor: theme.ghostBg, borderColor: theme.inputBorder }]}>
                  <Text style={[styles.ghostBtnText, { color: theme.text }]}>{t('SECURITY_QNA')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.text }]}>{t('EMAIL')}</Text>
                <TextInput value={form.newId} onChangeText={v => update('newId', v)} autoCapitalize="none" keyboardType="email-address"
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                <Text style={[styles.label, { color: theme.text }]}>{t('PASSWORD')}</Text>
                <TextInput value={form.newPassword} onChangeText={v => update('newPassword', v)} secureTextEntry
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                <Text style={[styles.label, { color: theme.text }]}>{t('PASSWORD_CONFIRM')}</Text>
                <TextInput value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                {!!errAccount && <Text style={styles.error}>{errAccount}</Text>}
                {!!okAccount && <Text style={styles.ok}>{okAccount}</Text>}
                <View style={styles.row}>
                  <Pressable onPress={saveAccount} disabled={savingAccount} style={[styles.primaryBtn, { backgroundColor: theme.primary }, savingAccount && { opacity: 0.6 }]}>
                    {savingAccount ? <ActivityIndicator /> : <Text style={styles.primaryBtnText}>{t('CONFIRM')}</Text>}
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingAccount(false);
                      setForm(f => ({ ...f, newId: current.id || '', newPassword: '', confirmPassword: '' }));
                    }}
                    style={[styles.ghostBtn, { backgroundColor: theme.ghostBg, borderColor: theme.inputBorder }]}
                  >
                    <Text style={[styles.ghostBtnText, { color: theme.text }]}>{t('CANCEL')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {/* Profile */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('PROFILE')}</Text>
            {!editingProfile ? (
              <>
                <View style={styles.rowBetween}><Text style={[styles.label, { color: theme.text }]}>{t('WEIGHT')}</Text><Text style={[styles.value, { color: theme.text }]}>{current.weight !== '' ? String(current.weight) : '-'}</Text></View>
                <View style={styles.rowBetween}><Text style={[styles.label, { color: theme.text }]}>{t('HEIGHT')}</Text><Text style={[styles.value, { color: theme.text }]}>{current.height !== '' ? String(current.height) : '-'}</Text></View>
                <View style={styles.rowBetween}><Text style={[styles.label, { color: theme.text }]}>{t('AGE')}</Text><Text style={[styles.value, { color: theme.text }]}>{current.age !== '' ? String(current.age) : '-'}</Text></View>
                <View style={styles.rowBetween}><Text style={[styles.label, { color: theme.text }]}>{t('GENDER')}</Text><Text style={[styles.value, { color: theme.text }]}>{current.gender === 'M' ? t('MALE') : current.gender === 'F' ? t('FEMALE') : '-'}</Text></View>
                {!!errProfile && <Text style={styles.error}>{errProfile}</Text>}
                {!!okProfile && <Text style={styles.ok}>{okProfile}</Text>}
                <Pressable onPress={() => { setErrProfile(''); setOkProfile(''); setEditingProfile(true); }} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
                  <Text style={styles.primaryBtnText}>{t('EDIT')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('WEIGHT')}</Text>
                    <TextInput value={form.weight} onChangeText={v => update('weight', v)} keyboardType="decimal-pad"
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('HEIGHT')}</Text>
                    <TextInput value={form.height} onChangeText={v => update('height', v)} keyboardType="number-pad"
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                  </View>
                </View>
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('AGE')}</Text>
                    <TextInput value={form.age} onChangeText={v => update('age', v)} keyboardType="number-pad"
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('GENDER')}</Text>
                    <View style={styles.segmentWrap}>
                      <Pressable onPress={() => update('gender', form.gender === 'M' ? '' : 'M')} style={[styles.segmentBtn, form.gender === 'M' && styles.segmentBtnActive]}>
                        <Text style={[styles.segmentText, form.gender === 'M' && styles.segmentTextActive]}>{t('MALE')}</Text>
                      </Pressable>
                      <Pressable onPress={() => update('gender', form.gender === 'F' ? '' : 'F')} style={[styles.segmentBtn, form.gender === 'F' && styles.segmentBtnActive]}>
                        <Text style={[styles.segmentText, form.gender === 'F' && styles.segmentTextActive]}>{t('FEMALE')}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('TARGET_WEIGHT')}</Text>
                    <TextInput value={form.targetWeight} onChangeText={v => update('targetWeight', v)} keyboardType="decimal-pad"
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.text }]}>{t('TARGET_CALORIES')}</Text>
                    <TextInput value={form.targetCalories} onChangeText={v => update('targetCalories', v)} keyboardType="number-pad"
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} />
                  </View>
                </View>
                {!!errProfile && <Text style={styles.error}>{errProfile}</Text>}
                {!!okProfile && <Text style={styles.ok}>{okProfile}</Text>}
                <View style={styles.row}>
                  <Pressable onPress={saveProfile} disabled={savingProfile} style={[styles.primaryBtn, { backgroundColor: theme.primary }, savingProfile && { opacity: 0.6 }]}>
                    {savingProfile ? <ActivityIndicator /> : <Text style={styles.primaryBtnText}>{t('CONFIRM')}</Text>}
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingProfile(false);
                      setForm(f => ({
                        ...f,
                        weight: current.weight === '' ? '' : String(current.weight),
                        height: current.height === '' ? '' : String(current.height),
                        age: current.age === '' ? '' : String(current.age),
                        gender: current.gender ?? '',
                      }));
                    }}
                    style={[styles.ghostBtn, { backgroundColor: theme.ghostBg, borderColor: theme.inputBorder }]}
                  >
                    <Text style={[styles.ghostBtnText, { color: theme.text }]}>{t('CANCEL')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* 비밀번호 확인 모달 */}
        <Modal visible={pwModal} transparent animationType="fade" onRequestClose={() => setPwModal(false)}>
          <View style={{ flex:1, backgroundColor: theme.scrim, alignItems:'center', justifyContent:'center', padding:16 }}>
            <View style={{ width:'100%', borderRadius:16, backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth:1, padding:16, gap:10 }}>
              <Text style={{ fontFamily: FONT, color: theme.text, fontSize: 18 }}> {t('PASSWORD')} </Text>
              <TextInput value={pwInput} onChangeText={setPwInput} secureTextEntry
                style={{ borderWidth:1, borderColor: theme.inputBorder, borderRadius:10, padding:10, backgroundColor: theme.inputBg, color: theme.text, fontFamily: FONT }} />
              <View style={{ flexDirection:'row', gap:10 }}>
                <TouchableOpacity onPress={() => setPwModal(false)} style={[styles.ghostBtn, { backgroundColor: theme.ghostBg, borderColor: theme.inputBorder, flex:1 }]}>
                  <Text style={[styles.ghostBtnText, { color: theme.text }]}>{t('CANCEL')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={verifyPwAndGo} style={[styles.primaryBtn, { backgroundColor: theme.primary, flex:1 }]}>
                  <Text style={styles.primaryBtnText}>{t('CONFIRM')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    position: 'absolute', left: 0, right: 0, textAlign: 'center',
    fontSize: 26, lineHeight: 32, textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, zIndex: 10,
    fontFamily: FONT, fontWeight: 'normal', includeFontPadding: true,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { paddingHorizontal: 16, gap: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardTitle: { fontSize: 18, lineHeight: 22, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', fontFamily: FONT, fontWeight: 'normal', includeFontPadding: true },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: { fontFamily: FONT, fontWeight: 'normal', fontSize: 16, lineHeight: 20, includeFontPadding: true },
  value: { fontFamily: FONT, fontWeight: 'normal', fontSize: 16, lineHeight: 20, includeFontPadding: true },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONT, fontSize: 16, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  row2: { flexDirection: 'row', gap: 12 },
  segmentWrap: { flexDirection: 'row', gap: 8 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)', alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  segmentText: { fontFamily: FONT, fontWeight: 'normal', fontSize: 16, lineHeight: 20, includeFontPadding: true },
  segmentTextActive: { color: '#fff', fontFamily: FONT, fontWeight: 'normal', fontSize: 16, lineHeight: 20, includeFontPadding: true },
  primaryBtn: { backgroundColor: '#111827', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontFamily: FONT, fontWeight: 'normal', fontSize: 16, lineHeight: 20, includeFontPadding: true },
  ghostBtn: { borderWidth: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ghostBtnText: { fontFamily: FONT, fontWeight: 'normal', fontSize: 16, lineHeight: 20, includeFontPadding: true },
  error: { color: '#dc2626', marginTop: 6, fontFamily: FONT, fontSize: 14, lineHeight: 18, includeFontPadding: true },
  ok: { color: '#16a34a', marginTop: 6, fontFamily: FONT, fontSize: 14, lineHeight: 18, includeFontPadding: true },
});

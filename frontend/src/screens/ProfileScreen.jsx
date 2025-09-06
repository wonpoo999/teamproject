import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { API_BASE_DEBUG } from '../config/api';

export default function ProfileScreen() {
  const auth = useAuth();

  const [current, setCurrent] = useState({
    id: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
  });

  const [editingAccount, setEditingAccount] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [form, setForm] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    newId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [errAccount, setErrAccount] = useState('');
  const [errProfile, setErrProfile] = useState('');
  const [okAccount, setOkAccount] = useState('');
  const [okProfile, setOkProfile] = useState('');

  const [getEndpoint, setGetEndpoint] = useState(null);

  const getAuth = useCallback(async () => {
    const ctxToken = auth?.token || auth?.authToken;
    const ctxType = auth?.tokenType || auth?.token_type || 'Bearer';
    if (ctxToken) return { token: ctxToken, type: ctxType };
    const keys = ['token', 'authToken', 'accessToken', '@auth/token'];
    for (const k of keys) {
      const v = await AsyncStorage.getItem(k);
      if (v) return { token: v, type: 'Bearer' };
    }
    return { token: null, type: 'Bearer' };
  }, [auth]);

  const fetchFirstOK = useCallback(
    async (method, paths, body) => {
      const { token, type } = await getAuth();
      let lastErr;
      for (const p of paths) {
        try {
          const res = await fetch(`${API_BASE_DEBUG}${p}`, {
            method,
            headers: {
              ...(body ? { 'Content-Type': 'application/json' } : {}),
              ...(token ? { Authorization: `${type} ${token}` } : {}),
            },
            credentials: 'include',
            ...(body ? { body: JSON.stringify(body) } : {}),
          });
          if (res.ok) {
            let data = {};
            try {
              data = await res.json();
            } catch (_) {}
            return { data, used: p };
          }
          if (res.status === 401 || res.status === 403) {
            const msgText = await res.text();
            const msg = msgText || '권한이 없습니다. 다시 로그인 해주세요.';
            throw new Error(msg);
          }
          lastErr = new Error(await res.text());
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error('요청 실패');
    },
    [getAuth]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErrAccount('');
    setErrProfile('');
    setOkAccount('');
    setOkProfile('');
    try {
      const { data, used } = await fetchFirstOK('GET', [
        '/api/profile',
        '/api/users/me',
        '/api/auth/me',
        '/api/customers/me',
      ]);
      setGetEndpoint(used || null);
      setCurrent({
        id: data.id ?? data.email ?? '',
        weight: data.weight ?? '',
        height: data.height ?? '',
        age: data.age ?? '',
        gender: data.gender ?? '',
      });
      setForm({
        weight: '',
        height: '',
        age: '',
        gender: '',
        newId: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (e) {
      const msg =
        (e?.message || '').toLowerCase().includes('forbidden') ||
        (e?.message || '').includes('401') ||
        (e?.message || '').includes('403')
          ? '프로필을 불러오지 못했습니다. 다시 로그인해 주세요.'
          : '프로필을 불러오지 못했습니다.';
      setErrProfile(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchFirstOK]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const saveAccount = async () => {
    setSavingAccount(true);
    setErrAccount('');
    setOkAccount('');
    try {
      if (form.newId && !/^\S+@\S+\.\S+$/.test(form.newId)) {
        throw new Error('새 이메일 형식이 올바르지 않습니다.');
      }
      const changingPw =
        form.currentPassword || form.newPassword || form.confirmPassword;
      if (changingPw) {
        if (!form.currentPassword) throw new Error('현재 비밀번호를 입력해 주세요.');
        if ((form.newPassword || '').length < 6)
          throw new Error('새 비밀번호는 6자 이상이어야 합니다.');
        if (form.newPassword !== form.confirmPassword)
          throw new Error('새 비밀번호 확인이 일치하지 않습니다.');
      }

      const payload = {
        ...(form.newId ? { id: form.newId } : {}),
        ...(form.newPassword
          ? { currentPassword: form.currentPassword, password: form.newPassword }
          : {}),
      };
      if (Object.keys(payload).length === 0) {
        setOkAccount('변경할 내용이 없습니다.');
        setEditingAccount(false);
        return;
      }

      const candidates = [
        getEndpoint,
        '/api/profile',
        '/api/users/me',
        '/api/account',
      ].filter(Boolean);

      await fetchFirstOK('PUT', candidates, payload);

      setOkAccount(
        `${form.newId ? '이메일 ' : ''}${
          form.newPassword ? (form.newId ? '및 비밀번호 ' : '비밀번호 ') : ''
        }수정 완료${
          form.newId || form.newPassword ? ' (다시 로그인이 필요할 수 있어요)' : ''
        }`
      );
      setEditingAccount(false);
      await load();
    } catch (e) {
      const msg =
        (e?.message || '').toLowerCase().includes('forbidden') ? '권한이 없습니다. 다시 로그인해 주세요.' : (e?.message || '계정 정보 수정 실패');
      setErrAccount(msg);
    } finally {
      setSavingAccount(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setErrProfile('');
    setOkProfile('');
    try {
      const numOk = v => v === '' || !Number.isNaN(Number(v));
      if (!numOk(form.weight) || !numOk(form.height) || !numOk(form.age)) {
        throw new Error('키/몸무게/나이는 숫자여야 합니다.');
      }

      const payload = {
        ...(form.weight !== '' ? { weight: Number(form.weight) } : {}),
        ...(form.height !== '' ? { height: Number(form.height) } : {}),
        ...(form.age !== '' ? { age: Number(form.age) } : {}),
        ...(form.gender ? { gender: form.gender } : {}),
      };
      if (Object.keys(payload).length === 0) {
        setOkProfile('변경할 내용이 없습니다.');
        setEditingProfile(false);
        return;
      }

      const candidates = [
        getEndpoint,
        '/api/profile',
        '/api/users/me',
        '/api/customers/me',
      ].filter(Boolean);

      await fetchFirstOK('PUT', candidates, payload);

      setOkProfile('프로필 수정이 완료되었습니다.');
      setEditingProfile(false);
      await load();
    } catch (e) {
      const msg =
        (e?.message || '').toLowerCase().includes('forbidden') ? '권한이 없습니다. 다시 로그인해 주세요.' : (e?.message || '프로필 수정 실패');
      setErrProfile(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>계정 정보</Text>

          {!editingAccount ? (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>현재 이메일</Text>
                <Text style={styles.value}>
                  {current.id ? String(current.id) : '-'}
                </Text>
              </View>

              {!!errAccount && <Text style={styles.error}>{errAccount}</Text>}
              {!!okAccount && <Text style={styles.ok}>{okAccount}</Text>}

              <Pressable
                onPress={() => {
                  setErrAccount('');
                  setOkAccount('');
                  setForm(f => ({
                    ...f,
                    newId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  }));
                  setEditingAccount(true);
                }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>수정</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>새 이메일(변경 시에만 입력)</Text>
              <TextInput
                value={form.newId}
                onChangeText={v => update('newId', v)}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>현재 비밀번호</Text>
                  <TextInput
                    value={form.currentPassword}
                    onChangeText={v => update('currentPassword', v)}
                    placeholder="비밀번호 변경 시에만 입력"
                    secureTextEntry
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>새 비밀번호</Text>
                  <TextInput
                    value={form.newPassword}
                    onChangeText={v => update('newPassword', v)}
                    placeholder="6자 이상"
                    secureTextEntry
                    style={styles.input}
                  />
                </View>
              </View>

              <Text style={styles.label}>새 비밀번호 확인</Text>
              <TextInput
                value={form.confirmPassword}
                onChangeText={v => update('confirmPassword', v)}
                secureTextEntry
                style={styles.input}
              />

              {!!errAccount && <Text style={styles.error}>{errAccount}</Text>}
              {!!okAccount && <Text style={styles.ok}>{okAccount}</Text>}

              <View style={styles.row}>
                <Pressable
                  onPress={saveAccount}
                  disabled={savingAccount}
                  style={[styles.primaryBtn, savingAccount && { opacity: 0.6 }]}
                >
                  {savingAccount ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.primaryBtnText}>확인</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setEditingAccount(false)}
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>취소</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>프로필 정보</Text>

          {!editingProfile ? (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>체중(kg)</Text>
                <Text style={styles.value}>
                  {current.weight !== '' ? String(current.weight) : '-'}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>키(cm)</Text>
                <Text style={styles.value}>
                  {current.height !== '' ? String(current.height) : '-'}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>나이</Text>
                <Text style={styles.value}>
                  {current.age !== '' ? String(current.age) : '-'}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>성별</Text>
                <Text style={styles.value}>
                  {current.gender === 'M' ? '남성' : current.gender === 'F' ? '여성' : '-'}
                </Text>
              </View>

              {!!errProfile && <Text style={styles.error}>{errProfile}</Text>}
              {!!okProfile && <Text style={styles.ok}>{okProfile}</Text>}

              <Pressable
                onPress={() => {
                  setErrProfile('');
                  setOkProfile('');
                  setForm(f => ({ ...f, weight: '', height: '', age: '', gender: '' }));
                  setEditingProfile(true);
                }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>수정</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>체중(kg)</Text>
                  <TextInput
                    value={form.weight}
                    onChangeText={v => update('weight', v)}
                    placeholder=""
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>키(cm)</Text>
                  <TextInput
                    value={form.height}
                    onChangeText={v => update('height', v)}
                    placeholder=""
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>나이</Text>
                  <TextInput
                    value={form.age}
                    onChangeText={v => update('age', v)}
                    placeholder=""
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>성별</Text>
                  <View style={styles.segmentWrap}>
                    <Pressable
                      onPress={() => update('gender', form.gender === 'M' ? '' : 'M')}
                      style={[
                        styles.segmentBtn,
                        form.gender === 'M' && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          form.gender === 'M' && styles.segmentTextActive,
                        ]}
                      >
                        남성
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => update('gender', form.gender === 'F' ? '' : 'F')}
                      style={[
                        styles.segmentBtn,
                        form.gender === 'F' && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          form.gender === 'F' && styles.segmentTextActive,
                        ]}
                      >
                        여성
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {!!errProfile && <Text style={styles.error}>{errProfile}</Text>}
              {!!okProfile && <Text style={styles.ok}>{okProfile}</Text>}

              <View style={styles.row}>
                <Pressable
                  onPress={saveProfile}
                  disabled={savingProfile}
                  style={[styles.primaryBtn, savingProfile && { opacity: 0.6 }]}
                >
                  {savingProfile ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.primaryBtnText}>확인</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setEditingProfile(false)}
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>취소</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: { fontWeight: '600' },
  value: { fontWeight: '700', color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  row2: { flexDirection: 'row', gap: 12 },
  segmentWrap: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  segmentText: { fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  ghostBtnText: { fontWeight: '700' },
  error: { color: '#dc2626', marginTop: 6 },
  ok: { color: '#16a34a', marginTop: 6 },
});

import React, { useEffect, useState, useCallback } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '../context/AuthContext'
import { ORIGIN } from '../config/api'

export default function ProfileScreen() {
  const auth = useAuth()
  const userId = auth?.user?.id || null

  const [current, setCurrent] = useState({ id: '', weight: '', height: '', age: '', gender: '' })
  const [editingAccount, setEditingAccount] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  const [form, setForm] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    targetWeight: '',
    targetCalories: '',
    newId: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState(true)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [errAccount, setErrAccount] = useState('')
  const [errProfile, setErrProfile] = useState('')
  const [okAccount, setOkAccount] = useState('')
  const [okProfile, setOkProfile] = useState('')
  const [getEndpoint, setGetEndpoint] = useState(null)

  const getAuth = useCallback(async () => {
    const ctxType = auth?.tokenType || auth?.token_type || 'Bearer'
    try {
      const s = await SecureStore.getItemAsync('accessToken')
      if (s) {
        const m = String(s).match(/^(Bearer|Basic|Token)\s+(.+)$/i)
        return { token: m ? m[2] : s, type: m ? m[1] : 'Bearer' }
      }
    } catch {}
    const keys = ['token', 'authToken', '@auth/token']
    for (const k of keys) {
      const v = await AsyncStorage.getItem(k)
      if (v) {
        const m = String(v).match(/^(Bearer|Basic|Token)\s+(.+)$/i)
        return { token: m ? m[2] : v, type: m ? m[1] : 'Bearer' }
      }
    }
    return { token: null, type: ctxType }
  }, [auth])

  const logoutToWelcome = useCallback(async () => {
    try { await AsyncStorage.multiRemove(['token','authToken','accessToken','@auth/token','@profile/prefill']) } catch {}
    try { await auth?.logout?.() } catch {}
  }, [auth])

  const fetchFirstOK = useCallback(
    async (method, paths, body) => {
      const { token, type } = await getAuth()
      let lastErr
      for (const p of paths) {
        try {
          const res = await fetch(`${ORIGIN}${p}`, {
            method,
            headers: {
              Accept: 'application/json',
              ...(body ? { 'Content-Type': 'application/json' } : {}),
              ...(token ? { Authorization: `${type} ${token}` } : {}),
            },
            credentials: 'include',
            ...(body ? { body: JSON.stringify(body) } : {}),
          })
          if (res.ok) {
            const t = await res.text()
            try { return { data: JSON.parse(t), used: p } } catch { return { data: null, used: p } }
          }
          if (res.status === 401 || res.status === 403) {
            const t = await res.text()
            throw new Error(t || '401')
          }
          lastErr = new Error(await res.text())
        } catch (e) {
          lastErr = e
        }
      }
      throw lastErr || new Error('요청 실패')
    },
    [getAuth]
  )

  const applyToState = useCallback((obj) => {
    const email = obj?.id ?? obj?.email ?? ''
    const weight = obj?.weight ?? ''
    const height = obj?.height ?? ''
    const age = obj?.age ?? ''
    const gender = obj?.gender ?? ''
    const targetWeight = obj?.targetWeight ?? ''
    const targetCalories = obj?.targetCalories ?? ''
    setCurrent({ id: email, weight, height, age, gender })
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
    })
  }, [])

  const load = useCallback(async () => {
    setErrAccount(''); setErrProfile(''); setOkAccount(''); setOkProfile('')
    let showedPrefill = false
    try {
      const raw = await AsyncStorage.getItem('@profile/prefill')
      if (raw) {
        const prefill = JSON.parse(raw)
        if (!prefill?.id || !userId || String(prefill.id) === String(userId)) {
          applyToState(prefill)
          setLoading(false)
          showedPrefill = true
        } else {
          await AsyncStorage.removeItem('@profile/prefill')
        }
      }
    } catch {}

    try {
      const { data, used } = await fetchFirstOK('GET', ['/api/profile', '/api/profile/'])
      setGetEndpoint(used || '/api/profile')
      if (data) applyToState(data)
      setLoading(false)
      try { await AsyncStorage.removeItem('@profile/prefill') } catch {}
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
        await logoutToWelcome()
        return
      }
      if (!showedPrefill) {
        setErrProfile('프로필을 불러오지 못했습니다.')
        setLoading(false)
      }
    }
  }, [applyToState, fetchFirstOK, logoutToWelcome, userId])

  useEffect(() => { load() }, [load])

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const saveAccount = async () => {
    setSavingAccount(true)
    setErrAccount('')
    setOkAccount('')
    try {
      const nextId = (form.newId || current.id || '').trim()
      if (!nextId || !/^\S+@\S+\.\S+$/.test(nextId)) throw new Error('이메일 형식이 올바르지 않습니다.')
      const changingPw = !!form.newPassword || !!form.confirmPassword
      if (changingPw) {
        if ((form.newPassword || '').length < 8) throw new Error('새 비밀번호는 8자 이상이어야 합니다.')
        if (form.newPassword !== form.confirmPassword) throw new Error('새 비밀번호 확인이 일치하지 않습니다.')
      }

      const payload = { id: nextId, ...(changingPw ? { newPassword: form.newPassword } : {}) }
      const candidates = [getEndpoint, '/api/profile', '/api/profile/'].filter(Boolean)
      await fetchFirstOK('PUT', candidates, payload)

      setOkAccount(`${form.newId ? '이메일 ' : ''}${changingPw ? (form.newId ? '및 비밀번호 ' : '비밀번호 ') : ''}수정 완료`)
      setEditingAccount(false)
      setCurrent(c => ({ ...c, id: nextId }))
      setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }))
      await AsyncStorage.removeItem('@profile/prefill')
      await load()
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
        await logoutToWelcome()
        return
      }
      setErrAccount(e?.message || '계정 정보 수정 실패')
    } finally {
      setSavingAccount(false)
    }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    setErrProfile('')
    setOkProfile('')
    try {
      const numOk = v => v === '' || !Number.isNaN(Number(v))
      if (!numOk(form.weight) || !numOk(form.height) || !numOk(form.age) || !numOk(form.targetWeight) || !numOk(form.targetCalories)) {
        throw new Error('숫자 항목은 숫자로 입력하세요.')
      }

      const payload = {
        id: (current.id || '').trim(),
        ...(form.weight !== '' ? { weight: Number(form.weight) } : {}),
        ...(form.height !== '' ? { height: Number(form.height) } : {}),
        ...(form.age !== '' ? { age: Number(form.age) } : {}),
        ...(form.gender ? { gender: form.gender } : {}),
        ...(form.targetWeight !== '' ? { targetWeight: Number(form.targetWeight) } : {}),
        ...(form.targetCalories !== '' ? { targetCalories: Number(form.targetCalories) } : {}),
      }

      const candidates = [getEndpoint, '/api/profile', '/api/profile/'].filter(Boolean)
      await fetchFirstOK('PUT', candidates, payload)

      setOkProfile('프로필 수정이 완료되었습니다.')
      setEditingProfile(false)
      await AsyncStorage.removeItem('@profile/prefill')
      await load()
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('forbidden') || msg.includes('401') || msg.includes('403')) {
        await logoutToWelcome()
        return
      }
      setErrProfile(e?.message || '프로필 수정 실패')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>계정 정보</Text>

          {!editingAccount ? (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>현재 이메일</Text>
                <Text style={styles.value}>{current.id ? String(current.id) : '-'}</Text>
              </View>
              {!!errAccount && <Text style={styles.error}>{errAccount}</Text>}
              {!!okAccount && <Text style={styles.ok}>{okAccount}</Text>}
              <Pressable onPress={() => { setErrAccount(''); setOkAccount(''); setEditingAccount(true) }} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>수정</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>이메일</Text>
              <TextInput value={form.newId} onChangeText={v => update('newId', v)} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

              <Text style={styles.label}>새 비밀번호</Text>
              <TextInput value={form.newPassword} onChangeText={v => update('newPassword', v)} secureTextEntry style={styles.input} />

              <Text style={styles.label}>새 비밀번호 확인</Text>
              <TextInput value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry style={styles.input} />

              {!!errAccount && <Text style={styles.error}>{errAccount}</Text>}
              {!!okAccount && <Text style={styles.ok}>{okAccount}</Text>}

              <View style={styles.row}>
                <Pressable onPress={saveAccount} disabled={savingAccount} style={[styles.primaryBtn, savingAccount && { opacity: 0.6 }]}>
                  {savingAccount ? <ActivityIndicator /> : <Text style={styles.primaryBtnText}>확인</Text>}
                </Pressable>
                <Pressable
                  onPress={() => {
                    setEditingAccount(false)
                    setForm(f => ({ ...f, newId: current.id || '', newPassword: '', confirmPassword: '' }))
                  }}
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
              <View style={styles.rowBetween}><Text style={styles.label}>체중(kg)</Text><Text style={styles.value}>{current.weight !== '' ? String(current.weight) : '-'}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.label}>키(cm)</Text><Text style={styles.value}>{current.height !== '' ? String(current.height) : '-'}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.label}>나이</Text><Text style={styles.value}>{current.age !== '' ? String(current.age) : '-'}</Text></View>
              <View style={styles.rowBetween}><Text style={styles.label}>성별</Text><Text style={styles.value}>{current.gender === 'M' ? '남성' : current.gender === 'F' ? '여성' : '-'}</Text></View>

              {!!errProfile && <Text style={styles.error}>{errProfile}</Text>}
              {!!okProfile && <Text style={styles.ok}>{okProfile}</Text>}

              <Pressable onPress={() => { setErrProfile(''); setOkProfile(''); setEditingProfile(true) }} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>수정</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>체중(kg)</Text>
                  <TextInput value={form.weight} onChangeText={v => update('weight', v)} keyboardType="decimal-pad" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>키(cm)</Text>
                  <TextInput value={form.height} onChangeText={v => update('height', v)} keyboardType="number-pad" style={styles.input} />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>나이</Text>
                  <TextInput value={form.age} onChangeText={v => update('age', v)} keyboardType="number-pad" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>성별</Text>
                  <View style={styles.segmentWrap}>
                    <Pressable onPress={() => update('gender', form.gender === 'M' ? '' : 'M')} style={[styles.segmentBtn, form.gender === 'M' && styles.segmentBtnActive]}>
                      <Text style={[styles.segmentText, form.gender === 'M' && styles.segmentTextActive]}>남성</Text>
                    </Pressable>
                    <Pressable onPress={() => update('gender', form.gender === 'F' ? '' : 'F')} style={[styles.segmentBtn, form.gender === 'F' && styles.segmentBtnActive]}>
                      <Text style={[styles.segmentText, form.gender === 'F' && styles.segmentTextActive]}>여성</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>목표 체중(kg)</Text>
                  <TextInput value={form.targetWeight} onChangeText={v => update('targetWeight', v)} keyboardType="decimal-pad" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>목표 칼로리(kcal)</Text>
                  <TextInput value={form.targetCalories} onChangeText={v => update('targetCalories', v)} keyboardType="number-pad" style={styles.input} />
                </View>
              </View>

              {!!errProfile && <Text style={styles.error}>{errProfile}</Text>}
              {!!okProfile && <Text style={styles.ok}>{okProfile}</Text>}

              <View style={styles.row}>
                <Pressable onPress={saveProfile} disabled={savingProfile} style={[styles.primaryBtn, savingProfile && { opacity: 0.6 }]}>
                  {savingProfile ? <ActivityIndicator /> : <Text style={styles.primaryBtnText}>확인</Text>}
                </Pressable>
                <Pressable
                  onPress={() => {
                    setEditingProfile(false)
                    setForm(f => ({
                      ...f,
                      weight: current.weight === '' ? '' : String(current.weight),
                      height: current.height === '' ? '' : String(current.height),
                      age: current.age === '' ? '' : String(current.age),
                      gender: current.gender ?? '',
                    }))
                  }}
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
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 16 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 16, gap: 12 },
  cardTitle: { fontWeight: '700', fontSize: 18, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: { fontWeight: '600' },
  value: { fontWeight: '700', color: '#111827' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  row2: { flexDirection: 'row', gap: 12 },
  segmentWrap: { flexDirection: 'row', gap: 8 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  segmentText: { fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  primaryBtn: { flex: 1, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff' },
  ghostBtnText: { fontWeight: '700' },
  error: { color: '#dc2626', marginTop: 6 },
  ok: { color: '#16a34a', marginTop: 6 },
})

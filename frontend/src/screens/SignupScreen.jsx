// src/screens/SignupScreen.js
import { useState, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { apiPost, API_BASE_DEBUG } from '../config/api.js'

export default function SignupScreen({ navigation }) {
  let auth = null
  try { auth = useAuth?.() } catch { auth = null }

  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('F')
  const [height, setHeight] = useState('')
  const [loading, setLoading] = useState(false)

  const endpoint = useMemo(() => `${API_BASE_DEBUG}/api/auth/signup`, [])

  async function signupFallback(payload) {
    const res = await apiPost('/api/auth/signup', payload)
    return !!res
  }

  const onSubmit = async () => {
    if (!id || !password || !weight || !age || !gender || !height) {
      return Alert.alert('필수 입력', '모든 항목을 입력해 주세요.')
    }

    const payload = {
      id: id.trim(),
      password,
      weight: Number(weight),
      age: Number(age),
      gender,
      height: Number(height)
    }

    if (
      Number.isNaN(payload.age) ||
      Number.isNaN(payload.weight) ||
      Number.isNaN(payload.height)
    ) {
      return Alert.alert('형식 오류', '나이/체중/키는 숫자로 입력하세요.')
    }

    try {
      setLoading(true)
      console.log('▶ 요청 URL:', endpoint)
      console.log('▶ 보낼 데이터:', payload)

      const ok = auth?.signup
        ? await auth.signup(payload)
        : await signupFallback(payload)

      if (ok) {
        Alert.alert('성공', '회원가입 완료!')
        navigation.replace('Login')
      } else {
        Alert.alert('가입 실패', '다시 시도해 주세요.')
      }
    } catch (e) {
      Alert.alert('가입 실패', e?.message ?? '잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Sign Up</Text>

        <TextInput
          value={id}
          onChangeText={setId}
          placeholder="ID(이메일 등)"
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />
        <TextInput
          value={age}
          onChangeText={setAge}
          placeholder="Age"
          keyboardType="numeric"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setGender('F')}
            style={{ flex: 1, backgroundColor: gender === 'F' ? '#111827' : '#e5e7eb', padding: 12, borderRadius: 10 }}
          >
            <Text style={{ color: gender === 'F' ? '#fff' : '#111', textAlign: 'center' }}>여성</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setGender('M')}
            style={{ flex: 1, backgroundColor: gender === 'M' ? '#111827' : '#e5e7eb', padding: 12, borderRadius: 10 }}
          >
            <Text style={{ color: gender === 'M' ? '#fff' : '#111', textAlign: 'center' }}>남성</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Weight (kg)"
          keyboardType="numeric"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />
        <TextInput
          value={height}
          onChangeText={setHeight}
          placeholder="Height (cm)"
          keyboardType="numeric"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 10, opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            {loading ? 'Submitting…' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: '#6b7280' }}>이미 계정이 있나요? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={{ color: '#2563eb', fontWeight: '700' }}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

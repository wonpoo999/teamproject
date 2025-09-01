import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('f')
  const [height, setHeight] = useState('')
  const [loading, setLoading] = useState(false)

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
    if (Number.isNaN(payload.age) || Number.isNaN(payload.weight) || Number.isNaN(payload.height)) {
      return Alert.alert('형식 오류', '나이/체중/키는 숫자로 입력하세요.')
    }
    try {
      setLoading(true)
      const ok = await signup(payload)
      if (ok) navigation.replace('Login')
    } catch (e) {
      Alert.alert('가입 실패', e?.message ?? '잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Sign Up</Text>
        <TextInput value={id} onChangeText={setId} placeholder="ID(이메일 등)" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TextInput value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setGender('f')} style={{ flex: 1, backgroundColor: gender === 'f' ? '#111827' : '#e5e7eb', padding: 12, borderRadius: 10 }}>
            <Text style={{ color: gender === 'f' ? '#fff' : '#111', textAlign: 'center' }}>여성</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGender('m')} style={{ flex: 1, backgroundColor: gender === 'm' ? '#111827' : '#e5e7eb', padding: 12, borderRadius: 10 }}>
            <Text style={{ color: gender === 'm' ? '#fff' : '#111', textAlign: 'center' }}>남성</Text>
          </TouchableOpacity>
        </View>
        <TextInput value={weight} onChangeText={setWeight} placeholder="Weight (kg)" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TextInput value={height} onChangeText={setHeight} placeholder="Height (cm)" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TouchableOpacity onPress={onSubmit} disabled={loading} style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 10, opacity: loading ? 0.6 : 1 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>{loading ? 'Submitting…' : 'Create Account'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

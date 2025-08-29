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
  const [gender, setGender] = useState('female')
  const [height, setHeight] = useState('')

  const onSubmit = async () => {
    if (!id || !password || !weight || !age || !gender || !height) {
      Alert.alert('필수 입력')
      return
    }
    await signup({ id, password, weight, age, gender, height })
    navigation.replace('Home')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80} // 필요에 따라 조정
    >
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Sign Up</Text>
        <TextInput value={id} onChangeText={setId} placeholder="ID" autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TextInput value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setGender('female')}
            style={{
              flex: 1,
              backgroundColor: gender === 'female' ? '#111827' : '#e5e7eb',
              padding: 12,
              borderRadius: 10
            }}>
            <Text style={{ color: gender === 'female' ? '#fff' : '#111', textAlign: 'center' }}>여성</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGender('male')}
            style={{
              flex: 1,
              backgroundColor: gender === 'male' ? '#111827' : '#e5e7eb',
              padding: 12,
              borderRadius: 10
            }}>
            <Text style={{ color: gender === 'male' ? '#fff' : '#111', textAlign: 'center' }}>남성</Text>
          </TouchableOpacity>
        </View>
        <TextInput value={weight} onChangeText={setWeight} placeholder="Weight (kg)" keyboardType="numeric"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TextInput value={height} onChangeText={setHeight} placeholder="Height (cm)" keyboardType="numeric"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }} />
        <TouchableOpacity onPress={onSubmit}
          style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 10 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Create Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

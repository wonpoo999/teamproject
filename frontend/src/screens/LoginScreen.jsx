import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({ navigation }) {
  const { login, needsGoalSetup } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (loading) return
    if (!id || !password) {
      Alert.alert('입력 필요', '아이디와 비밀번호를 입력해주세요.')
      return
    }
    try {
      setLoading(true)
      const ok = await login(id.trim(), password)
      if (!ok) throw new Error('로그인 실패')


      if (needsGoalSetup) {
        navigation.reset({ index: 0, routes: [{ name: 'Goal' }] })
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
      }
    } catch (e) {
      Alert.alert('로그인 실패', e?.message ?? '다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          gap: 12,
          flexGrow: 1,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Login
        </Text>

        <TextInput
          value={id}
          onChangeText={setId}
          placeholder="ID"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 12,
          }}
          returnKeyType="next"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          textContentType="password"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 12,
          }}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#93c5fd' : '#2563eb',
            padding: 14,
            borderRadius: 10,
            marginTop: 6,
          }}
        >
          <Text
            style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}
          >
            {loading ? '로그인 중…' : 'Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
